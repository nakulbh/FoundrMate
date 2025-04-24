import { Request, Response } from 'express';
import { google } from 'googleapis';
import { getGmailClient } from '../config/gmailAuth';

interface Email {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  snippet: string;
  htmlBody: string;
  date: string;
  labels: string[];
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

    // Fetch emails from Gmail API
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults,
      q: query,
      pageToken
    });

    const messages = response.data.messages || [];
    
    // Process messages in parallel
    const fullMessages = await Promise.all(
      messages.map(async (message: any) => {
        const msg = await gmail.users.messages.get({
          userId: 'me',
          id: message.id!,
          format: 'metadata',
          metadataHeaders: ['From', 'To', 'Subject', 'Date']
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

// Helper function to process Gmail message
const processGmailMessage = (message: any): Email => {
  const headers = message.payload.headers || [];
  
  return {
    id: message.id,
    threadId: message.threadId,
    from: getHeaderValue(headers, 'From'),
    to: getHeaderValue(headers, 'To'),
    subject: getHeaderValue(headers, 'Subject'),
    snippet: message.snippet || '',
    htmlBody: '', // We can't get HTML body with metadata format
    date: getHeaderValue(headers, 'Date'),
    labels: message.labelIds || []
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