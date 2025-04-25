import { Request, Response } from 'express';
import { createGmailClientWithToken } from '../gmailClient';
import { handleGmailError } from './email.controller';
import { gmail_v1 } from 'googleapis';

// Keywords that typically indicate promotional or non-important emails
const PROMOTIONAL_KEYWORDS = [
  'unsubscribe',
  'manage preferences',
  'promotional offer',
  'special deal',
  'limited time',
  'do not reply',
  'newsletter',
  'marketing email',
  'powered by',
  'you are receiving this email',
  'update your preferences',
  'click here to unsubscribe',
  'this is an automated message',
  'tracking number'
];

// Standard Gmail system labels
const SYSTEM_LABELS = {
  INBOX: 'INBOX',
  STARRED: 'STARRED', 
  SENT: 'SENT',
  DRAFT: 'DRAFT',
  SPAM: 'SPAM',
  TRASH: 'TRASH',
  IMPORTANT: 'IMPORTANT',
  UNREAD: 'UNREAD',
  CATEGORY_PERSONAL: 'CATEGORY_PERSONAL',
  CATEGORY_SOCIAL: 'CATEGORY_SOCIAL',
  CATEGORY_PROMOTIONS: 'CATEGORY_PROMOTIONS',
  CATEGORY_UPDATES: 'CATEGORY_UPDATES',
  CATEGORY_FORUMS: 'CATEGORY_FORUMS'
};

/**
 * Retrieves and filters messages based on label, query parameters, and categorizes them as important or other
 * 
 * @param req Express request object
 * @param res Express response object
 * 
 * Query parameters:
 * - q: Search query
 * - maxResults: Maximum number of results (default: 50)
 * - pageToken: Token for pagination
 * - includeSpamTrash: Whether to include spam/trash messages
 * - filter: 'important', 'other', or 'all' (default: 'all')
 */
export const getMessageWithQuery = async (req: Request, res: Response) => {
  try {
    // Get the access token from different sources
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
    
    // Extract label and query parameters from route params and query
    let labelIdParam = req.params.labelId || req.query.labelId || 'INBOX'; // Default to INBOX if not provided
    const queryParam = req.params.query || req.query.q || '';
    
    // Convert to string and normalize
    const labelId = String(labelIdParam).toUpperCase();
    
    // Check if we have a system label that needs special handling
    let finalLabelId: string;
    if (labelId in SYSTEM_LABELS) {
      finalLabelId = SYSTEM_LABELS[labelId as keyof typeof SYSTEM_LABELS];
    } else {
      finalLabelId = String(labelIdParam);
    }
    
    // Get the filter preference (important, other, or all)
    const filterPreference = req.query.filter as string || 'all';
    
    // Create Gmail client with the provided access token
    const gmail = createGmailClientWithToken(accessToken);
    
    // Additional optional parameters
    const maxResults = parseInt(req.query.maxResults as string) || 50;
    const pageToken = req.query.pageToken as string || undefined;
    const includeSpamTrash = req.query.includeSpamTrash === 'true';
    
    // Construct the Gmail API query string
    let queryString = '';
    if (queryParam) {
      queryString = queryParam as string;
    }
    
    // Fetch messages from Gmail API
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults,
      q: queryString,
      pageToken,
      labelIds: [finalLabelId],
      includeSpamTrash
    });
    
    const messages = response.data.messages || [];
    
    // If there are no messages, return an empty array
    if (!messages.length) {
      return res.json({
        success: true,
        messages: [],
        nextPageToken: response.data.nextPageToken || null
      });
    }
    
    // Fetch detailed information for each message
    const messageDetails = await Promise.all(
      messages.map(async (message: gmail_v1.Schema$Message) => {
        try {
          // Get full message content for categorization
          const msgResponse = await gmail.users.messages.get({
            userId: 'me',
            id: message.id!,
            format: 'full' // Get full message content to check for promotional keywords
          });
          
          const data = msgResponse.data;
          const headers = data.payload?.headers || [];
          
          // Extract headers
          const from = headers.find(h => h.name === 'From')?.value || '';
          const to = headers.find(h => h.name === 'To')?.value || '';
          const subject = headers.find(h => h.name === 'Subject')?.value || '';
          const date = headers.find(h => h.name === 'Date')?.value || '';
          
          // Check if email contains promotional keywords
          const fullBody = data.snippet || '';
          const rawContent = data.payload?.body?.data ? 
            Buffer.from(data.payload.body.data, 'base64').toString('utf-8') : '';
            
          // If there are parts (MIME multipart), extract text from them
          let partTexts = '';
          if (data.payload?.parts) {
            partTexts = data.payload.parts
              .filter(part => part.mimeType?.includes('text'))
              .map(part => {
                if (part.body?.data) {
                  return Buffer.from(part.body.data, 'base64').toString('utf-8');
                }
                return '';
              })
              .join(' ');
          }
          
          // Combine all text content for keyword search
          const fullContent = (fullBody + ' ' + rawContent + ' ' + partTexts).toLowerCase();
          
          // Check for promotional keywords
          const hasPromotionalKeywords = PROMOTIONAL_KEYWORDS.some(keyword => 
            fullContent.includes(keyword.toLowerCase())
          );
          
          // Determine category (important or other)
          const category = hasPromotionalKeywords ? 'other' : 'important';
          
          return {
            id: data.id,
            threadId: data.threadId,
            labelIds: data.labelIds,
            snippet: data.snippet,
            historyId: data.historyId,
            internalDate: data.internalDate,
            from,
            to,
            subject,
            date,
            category
          };
        } catch (error) {
          console.error(`Error fetching details for message ${message.id}:`, error);
          return {
            id: message.id,
            threadId: message.threadId,
            error: 'Failed to fetch message details'
          };
        }
      })
    );
    
    // Define message interface for better typing
    interface MessageDetail {
      id?: string;
      threadId?: string;
      labelIds?: string[];
      snippet?: string;
      historyId?: string;
      internalDate?: string;
      from?: string;
      to?: string;
      subject?: string;
      date?: string;
      category?: string;
      error?: string;
    }

    // Type assert message details
    const typedMessageDetails = messageDetails as MessageDetail[];
    
    // Filter messages based on the filter preference
    let filteredMessages = typedMessageDetails;
    if (filterPreference !== 'all') {
      filteredMessages = typedMessageDetails.filter(msg => msg.category === filterPreference);
    }
    
    res.json({
      success: true,
      messages: filteredMessages,
      important: typedMessageDetails.filter(msg => msg.category === 'important'),
      other: typedMessageDetails.filter(msg => msg.category === 'other'),
      nextPageToken: response.data.nextPageToken || null
    });
    
  } catch (error) {
    handleGmailError(error, res);
  }
};