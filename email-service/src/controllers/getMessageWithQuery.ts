import { Request, Response } from 'express';
import { createGmailClientWithToken } from '../gmailClient';
import { handleGmailError } from './email.controller';
import { gmail_v1 } from 'googleapis';

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
    const labelId = req.params.labelId || 'INBOX'; // Default to INBOX if not provided
    const queryParam = req.params.query || req.query.q || '';
    
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
      labelIds: [labelId],
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
      messages.map(async (message) => {
        try {
          const msgResponse = await gmail.users.messages.get({
            userId: 'me',
            id: message.id!,
            format: 'metadata',
            metadataHeaders: ['From', 'To', 'Subject', 'Date']
          });
          
          const data = msgResponse.data;
          const headers = data.payload?.headers || [];
          
          // Extract headers
          const from = headers.find(h => h.name === 'From')?.value || '';
          const to = headers.find(h => h.name === 'To')?.value || '';
          const subject = headers.find(h => h.name === 'Subject')?.value || '';
          const date = headers.find(h => h.name === 'Date')?.value || '';
          
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
            date
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
    
    res.json({
      success: true,
      messages: messageDetails,
      nextPageToken: response.data.nextPageToken || null
    });
    
  } catch (error) {
    handleGmailError(error, res);
  }
};