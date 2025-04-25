import { createGmailClientWithToken } from "../gmailClient";
import { handleGmailError } from "./email.controller";
import { Request, Response } from 'express';


export const getMessages = async (req: Request, res: Response) => {
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
      messages
    });
    
  } catch (error) {
    handleGmailError(error, res);
  }
};