import { Request, Response } from 'express';
import { google } from 'googleapis';
import { gmail_v1 } from 'googleapis';
import { getGmailClient, createGmailClientWithToken } from '../gmailClient';

interface Email {
  id: string;
  threadId: string;
  from: string;
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  snippet: string;
  htmlBody: string;
  date: string;
  labels: string[];
  hasAttachments?: boolean;
}

// Get a single email by ID with raw format
export const getEmailById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Email ID is required' });
    }
    
    // Get authenticated Gmail client
    const gmail = await getGmailClient();
    
    // Fetch email with metadata format
    const response = await gmail.users.messages.get({
      userId: 'me',
      id: id,
      format: 'metadata',
      metadataHeaders: ['From', 'To', 'Subject', 'Date', 'Content-Type']
    });
    
    if (!response.data) {
      return res.status(404).json({ error: 'Email not found' });
    }
    
    // Get the snippet as a preview of the content
    const snippet = response.data.snippet || '';
    
    // Process the message to extract all available data
    const emailData = processGmailMessage(response.data);
    
    // Return the email data
    res.json({
      success: true,
      email: emailData
    });
    
  } catch (error) {
    handleGmailError(error, res);
  }
};

export const getEmails = async (req: Request, res: Response) => {
  try {
    // Get authenticated Gmail client
    const gmail = await getGmailClient();
    
    // Extract query parameters
    const maxResults = parseInt(req.query.maxResults as string) || 10;
    const query = req.query.q as string || '';
    const pageToken = req.query.pageToken as string || undefined;
    const labelIds = req.query.labelIds ? (req.query.labelIds as string).split(',') : undefined;
    const includeSpamTrash = req.query.includeSpamTrash === 'true';

    // Fetch emails from Gmail API
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults,
      q: query,
      pageToken,
      labelIds,
      includeSpamTrash
    });

    const messages = response.data.messages || [];
    
    // Process messages in parallel
    const fullMessages = await Promise.all(
      messages.map(async (message: any) => {
        const msg = await gmail.users.messages.get({
          userId: 'me',
          id: message.id!,
          format: 'full'
        });
        return processGmailMessage(msg.data);
      })
    );

    res.json({
      success: true,
      count: fullMessages.length,
      nextPageToken: response.data.nextPageToken,
      emails: fullMessages
    });

  } catch (error) {
    handleGmailError(error, res);
  }
};

// Get emails using an access token directly
export const getEmailsWithToken = async (req: Request, res: Response) => {
  try {
    // Try to get the token from different sources
    let accessToken = req.body?.accessToken || req.body?.oauth_token;
    
    // If not in body, check query params
    if (!accessToken && req.query.oauth_token) {
      accessToken = req.query.oauth_token as string;
    }
    
    // If not in body or query, check authorization header
    if (!accessToken && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        accessToken = authHeader.substring(7);
      }
    }
    
    if (!accessToken) {
      return res.status(400).json({ error: 'OAuth token is required. Provide it in the request body, query parameter, or Authorization header' });
    }
    
    // Create Gmail client with the provided access token
    const gmail = createGmailClientWithToken(accessToken);
    
    // Extract query parameters
    const maxResults = parseInt(req.query.maxResults as string) || 50;
    const query = req.query.q as string || '';
    const pageToken = req.query.pageToken as string || undefined;
    const labelIds = req.query.labelIds ? (req.query.labelIds as string).split(',') : undefined;
    const includeSpamTrash = req.query.includeSpamTrash === 'true';
    
    // Fetch emails from Gmail API
    const response = await gmail.users.messages.list({
      userId: 'me',  // 'me' refers to the authenticated user
      maxResults,
      q: query,
      pageToken,
      labelIds,
      includeSpamTrash
    });

    
    const messages = response.data.messages || [];
    console.log("---------------Response has Received here-------------",JSON.stringify(messages));

    
    res.json({
      success: true,
      // response
      messages
    });
    
  } catch (error) {
    handleGmailError(error, res);
  }
};

// Gmail message part interface
interface GmailMessagePart {
  mimeType: string;
  filename?: string;
  headers?: { name: string; value: string }[];
  body?: {
    size?: number;
    data?: string;
    attachmentId?: string;
  };
  parts?: GmailMessagePart[];
}

// Email content interface
interface EmailContent {
  text: string;
  html: string;
}

// Email attachment interface
interface EmailAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
}

/**
 * Recursively extracts email content from message parts
 * @param messagePart - The Gmail message part to process
 * @returns Object containing text and HTML content
 */
function extractEmailContent(messagePart: GmailMessagePart): EmailContent {
  // Initialize containers for different content types
  let textContent = '';
  let htmlContent = '';

  // If the part has a body with data, process it based on MIME type
  if (messagePart.body && messagePart.body.data) {
    const content = Buffer.from(messagePart.body.data, 'base64').toString('utf8');

    // Store content based on its MIME type
    if (messagePart.mimeType === 'text/plain') {
      textContent = content;
    } else if (messagePart.mimeType === 'text/html') {
      htmlContent = content;
    }
  }

  // If the part has nested parts, recursively process them
  if (messagePart.parts && messagePart.parts.length > 0) {
    for (const part of messagePart.parts) {
      const { text, html } = extractEmailContent(part);
      if (text) textContent += text;
      if (html) htmlContent += html;
    }
  }

  // Return both plain text and HTML content
  return { text: textContent, html: htmlContent };
}

/**
 * Get a single email with token and return detailed content
 * @param req - Express request object
 * @param res - Express response object
 */
export const getEmailWithToken = async (req: Request, res: Response) => {
  try {
    // Validate required parameters
    const validatedArgs = {
      messageId: req.params.id || req.query.id as string
    };

    if (!validatedArgs.messageId) {
      return res.status(400).json({ error: 'Email ID is required' });
    }

    // Try to get the token from different sources
    let accessToken = req.body?.accessToken || req.body?.oauth_token;
    
    // If not in body, check query params
    if (!accessToken && req.query.oauth_token) {
      accessToken = req.query.oauth_token as string;
    }
    
    // If not in body or query, check authorization header
    if (!accessToken && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        accessToken = authHeader.substring(7);
      }
    }
    
    if (!accessToken) {
      return res.status(400).json({ 
        error: 'OAuth token is required. Provide it in the request body, query parameter, or Authorization header' 
      });
    }
    
    // Create Gmail client with the provided access token
    const gmail = createGmailClientWithToken(accessToken);

    // Fetch the full email message
    const response = await gmail.users.messages.get({
      userId: 'me',
      id: validatedArgs.messageId,
      format: 'full',
    });

    console.log(response);

    // Extract headers
    const headers = response.data.payload?.headers || [];
    const subject = headers.find(h => h.name?.toLowerCase() === 'subject')?.value || '';
    const from = headers.find(h => h.name?.toLowerCase() === 'from')?.value || '';
    const to = headers.find(h => h.name?.toLowerCase() === 'to')?.value || '';
    const date = headers.find(h => h.name?.toLowerCase() === 'date')?.value || '';
    const threadId = response.data.threadId || '';

    // Extract email content using the recursive function
    const { text, html } = extractEmailContent(response.data.payload as GmailMessagePart || {});

    // Use plain text content if available, otherwise use HTML content
    let body = text || html || '';

    // If we only have HTML content, add a note for the user
    const contentTypeNote = !text && html ?
      '[Note: This email is HTML-formatted. Plain text version not available.]\n\n' : '';

    // Get attachment information
    const attachments: EmailAttachment[] = [];
    const processAttachmentParts = (part: GmailMessagePart, path: string = '') => {
      if (part.body && part.body.attachmentId) {
        const filename = part.filename || `attachment-${part.body.attachmentId}`;
        attachments.push({
          id: part.body.attachmentId,
          filename: filename,
          mimeType: part.mimeType || 'application/octet-stream',
          size: part.body.size || 0
        });
      }

      if (part.parts) {
        part.parts.forEach((subpart: GmailMessagePart) =>
          processAttachmentParts(subpart, `${path}/parts`)
        );
      }
    };

    if (response.data.payload) {
      processAttachmentParts(response.data.payload as GmailMessagePart);
    }

    // Add attachment info to output if any are present
    const attachmentInfo = attachments.length > 0 ?
      `\n\nAttachments (${attachments.length}):\n` +
      attachments.map(a => `- ${a.filename} (${a.mimeType}, ${Math.round(a.size/1024)} KB)`).join('\n') : '';

    // Return the structured email data
    return res.json({
      success: true,
      email: {
        id: response.data.id,
        threadId,
        subject,
        from,
        to,
        date,
        content: [
          {
            type: "text",
            text: `Thread ID: ${threadId}\nSubject: ${subject}\nFrom: ${from}\nTo: ${to}\nDate: ${date}\n\n${contentTypeNote}${body}${attachmentInfo}`,
          },
        ],
        attachments: attachments.map(a => ({
          id: a.id,
          filename: a.filename,
          mimeType: a.mimeType,
          size: a.size
        }))
      }
    });

  } catch (error) {
    handleGmailError(error, res);
  }
};

// Helper function to process Gmail message
const processGmailMessage = (message: any): Email => {
  const headers = message.payload?.headers || [];
  
  return {
    id: message.id,
    threadId: message.threadId,
    from: getHeaderValue(headers, 'From'),
    to: getHeaderValue(headers, 'To'),
    cc: getHeaderValue(headers, 'Cc'),
    bcc: getHeaderValue(headers, 'Bcc'),
    subject: getHeaderValue(headers, 'Subject'),
    snippet: message.snippet || '',
    htmlBody: '', // We can't get HTML body with metadata format
    date: getHeaderValue(headers, 'Date'),
    labels: message.labelIds || [],
    hasAttachments: message.payload?.parts?.some((part: any) => part.filename && part.filename.length > 0) || false
  };
}

// Helper to extract HTML body from message parts
function extractHtmlBody(payload: any): string {
  if (payload.parts) {
    const htmlPart = findPartByMimeType(payload.parts, 'text/html');
    if (htmlPart) {
      return Buffer.from(htmlPart.body.data, 'base64').toString('utf-8');
    }
  }
  if (payload.mimeType === 'text/html') {
    return Buffer.from(payload.body.data, 'base64').toString('utf-8');
  }
  return '';
}

// Helper to find part by MIME type (recursive)
function findPartByMimeType(parts: any[], mimeType: string): any | null {
  for (const part of parts) {
    if (part.mimeType === mimeType) return part;
    if (part.parts) {
      const found = findPartByMimeType(part.parts, mimeType);
      if (found) return found;
    }
  }
  return null;
}

// Helper to get header value
function getHeaderValue(headers: any[], name: string): string {
  return headers.find((h: any) => h.name === name)?.value || '';
}

// Get a single message attachment
export const getAttachment = async (req: Request, res: Response) => {
  try {
    const { messageId, attachmentId } = req.params;
    const { accessToken } = req.body;
    
    if (!accessToken) {
      return res.status(400).json({ error: 'Access token is required' });
    }
    
    if (!messageId || !attachmentId) {
      return res.status(400).json({ error: 'Message ID and attachment ID are required' });
    }
    
    // Create Gmail client with the provided access token
    const gmail = createGmailClientWithToken(accessToken);
    
    // Get the attachment
    const response = await gmail.users.messages.attachments.get({
      userId: 'me',
      messageId,
      id: attachmentId
    });
    
    if (!response.data) {
      return res.status(404).json({ error: 'Attachment not found' });
    }
    
    res.json({
      success: true,
      attachment: response.data
    });
    
  } catch (error) {
    handleGmailError(error, res);
  }
};

// Get a single email with full details
export const getFullEmail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { accessToken } = req.body;
    
    if (!accessToken) {
      return res.status(400).json({ error: 'Access token is required' });
    }
    
    if (!id) {
      return res.status(400).json({ error: 'Email ID is required' });
    }
    
    // Create Gmail client with the provided access token
    const gmail = createGmailClientWithToken(accessToken);
    
    // Get the full email
    const response = await gmail.users.messages.get({
      userId: 'me',
      id,
      format: 'full'
    });
    
    if (!response.data) {
      return res.status(404).json({ error: 'Email not found' });
    }
    
    // Process the message to extract all details including body and attachments
    const emailData = processFullGmailMessage(response.data);
    
    res.json({
      success: true,
      email: emailData
    });
    
  } catch (error) {
    handleGmailError(error, res);
  }
};

interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
}

// Process a full Gmail message including body parts and attachments
const processFullGmailMessage = (message: any): any => {
  const headers = message.payload?.headers || [];
  const parts = message.payload?.parts || [];
  
  // Extract body content
  let htmlBody = '';
  let plainBody = '';
  
  if (message.payload) {
    if (message.payload.mimeType === 'text/html') {
      htmlBody = Buffer.from(message.payload.body.data || '', 'base64').toString('utf-8');
    } else if (message.payload.mimeType === 'text/plain') {
      plainBody = Buffer.from(message.payload.body.data || '', 'base64').toString('utf-8');
    } else if (parts.length > 0) {
      // Process multipart message
      for (const part of parts) {
        if (part.mimeType === 'text/html') {
          htmlBody = Buffer.from(part.body.data || '', 'base64').toString('utf-8');
        } else if (part.mimeType === 'text/plain') {
          plainBody = Buffer.from(part.body.data || '', 'base64').toString('utf-8');
        }
      }
    }
  }
  
  // Extract attachments
  const attachments: Attachment[] = [];
  if (parts.length > 0) {
    extractAttachments(parts, attachments);
  }
  
  return {
    id: message.id,
    threadId: message.threadId,
    from: getHeaderValue(headers, 'From'),
    to: getHeaderValue(headers, 'To'),
    cc: getHeaderValue(headers, 'Cc'),
    bcc: getHeaderValue(headers, 'Bcc'),
    subject: getHeaderValue(headers, 'Subject'),
    snippet: message.snippet || '',
    htmlBody,
    plainBody,
    date: getHeaderValue(headers, 'Date'),
    labels: message.labelIds || [],
    attachments
  };
};

// Recursively extract attachments from message parts
function extractAttachments(parts: any[], attachments: Attachment[]) {
  for (const part of parts) {
    if (part.filename && part.filename.length > 0) {
      attachments.push({
        id: part.body.attachmentId,
        filename: part.filename,
        mimeType: part.mimeType,
        size: part.body.size || 0
      });
    }
    
    if (part.parts && part.parts.length > 0) {
      extractAttachments(part.parts, attachments);
    }
  }
}

// Trash an email
export const trashEmail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { accessToken } = req.body;
    
    if (!accessToken) {
      return res.status(400).json({ error: 'Access token is required' });
    }
    
    if (!id) {
      return res.status(400).json({ error: 'Email ID is required' });
    }
    
    // Create Gmail client with the provided access token
    const gmail = createGmailClientWithToken(accessToken);
    
    // Move the email to trash
    const response = await gmail.users.messages.trash({
      userId: 'me',
      id
    });
    
    res.json({
      success: true,
      message: 'Email moved to trash',
      data: response.data
    });
    
  } catch (error) {
    handleGmailError(error, res);
  }
};

// Untrash an email
export const untrashEmail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { accessToken } = req.body;
    
    if (!accessToken) {
      return res.status(400).json({ error: 'Access token is required' });
    }
    
    if (!id) {
      return res.status(400).json({ error: 'Email ID is required' });
    }
    
    // Create Gmail client with the provided access token
    const gmail = createGmailClientWithToken(accessToken);
    
    // Remove the email from trash
    const response = await gmail.users.messages.untrash({
      userId: 'me',
      id
    });
    
    res.json({
      success: true,
      message: 'Email removed from trash',
      data: response.data
    });
    
  } catch (error) {
    handleGmailError(error, res);
  }
};

// Modify email labels
export const modifyEmailLabels = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { accessToken, addLabelIds, removeLabelIds } = req.body;
    
    if (!accessToken) {
      return res.status(400).json({ error: 'Access token is required' });
    }
    
    if (!id) {
      return res.status(400).json({ error: 'Email ID is required' });
    }
    
    // Create Gmail client with the provided access token
    const gmail = createGmailClientWithToken(accessToken);
    
    // Modify the email labels
    const response = await gmail.users.messages.modify({
      userId: 'me',
      id,
      requestBody: {
        addLabelIds: addLabelIds || [],
        removeLabelIds: removeLabelIds || []
      }
    });
    
    res.json({
      success: true,
      message: 'Email labels modified',
      data: response.data
    });
    
  } catch (error) {
    handleGmailError(error, res);
  }
};

// Batch modify email labels
export const batchModifyEmailLabels = async (req: Request, res: Response) => {
  try {
    const { accessToken, ids, addLabelIds, removeLabelIds } = req.body;
    
    if (!accessToken) {
      return res.status(400).json({ error: 'Access token is required' });
    }
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Email IDs are required' });
    }
    
    // Create Gmail client with the provided access token
    const gmail = createGmailClientWithToken(accessToken);
    
    // Batch modify the email labels
    await gmail.users.messages.batchModify({
      userId: 'me',
      requestBody: {
        ids,
        addLabelIds: addLabelIds || [],
        removeLabelIds: removeLabelIds || []
      }
    });
    
    res.json({
      success: true,
      message: 'Email labels modified in batch'
    });
    
  } catch (error) {
    handleGmailError(error, res);
  }
};

// Create a draft reply to an email
export const createDraftReply = async (req: Request, res: Response) => {
  try {
    const { messageId, replyContent } = req.body;
    if (!messageId || !replyContent) {
      return res.status(400).json({ error: 'Message ID and reply content are required' });
    }
    
    // Get authenticated Gmail client
    const gmail = await getGmailClient();
    
    // Get the original message to extract headers
    const originalMessage = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'metadata',
      metadataHeaders: ['From', 'To', 'Subject', 'Message-ID', 'References', 'In-Reply-To']
    });
    
    if (!originalMessage.data) {
      return res.status(404).json({ error: 'Email not found' });
    }
    
    const headers = originalMessage.data.payload?.headers || [];
    const subject = getHeaderValue(headers, 'Subject');
    const from = getHeaderValue(headers, 'From');
    const to = getHeaderValue(headers, 'To');
    
    // Create a simple draft reply
    const messageSubject = subject.startsWith('Re:') ? subject : `Re: ${subject}`;
    
    // Extract email address from the From field
    const emailMatch = from.match(/<([^>]+)>/);
    const replyTo = emailMatch ? emailMatch[1] : from;
    
    // Create the draft email content
    const draftContent = `To: ${replyTo}\r\nSubject: ${messageSubject}\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n${replyContent}`;
    
    // Create the draft
    const draft = await gmail.users.drafts.create({
      userId: 'me',
      requestBody: {
        message: {
          threadId: originalMessage.data.threadId,
          raw: Buffer.from(draftContent).toString('base64url')
        }
      }
    });
    
    res.json({
      success: true,
      draftId: draft.data.id,
      message: 'Draft reply created successfully'
    });
    
  } catch (error) {
    handleGmailError(error, res);
  }
};

export const handleGmailError = (error: unknown, res: Response) => {
  console.error('Gmail API Error:', error);
  
  if (typeof error === 'object' && error !== null) {
    const err = error as any;
    
    if (err.code === 401) {
      return res.status(401).json({ error: 'Invalid or expired access token' });
    }
    if (err.code === 403) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    if (err.code === 429) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }
  }

  res.status(500).json({ 
    error: 'Failed to fetch emails',
    message: error instanceof Error ? error.message : 'Unknown error'
  });
}