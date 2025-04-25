import { Request, Response } from 'express';
import { createGmailClientWithToken } from '../gmailClient';
import { handleGmailError } from './email.controller';

/**
 * Sends an email or creates a draft based on request parameters
 * 
 * @param req Express request object
 * @param res Express response object
 * 
 * Request body: {
 *   accessToken: string  - OAuth access token
 *   to: string           - Recipient email
 *   subject: string      - Email subject
 *   body: string         - Email body (html supported)
 *   cc?: string          - CC recipients (comma separated)
 *   bcc?: string         - BCC recipients (comma separated)
 *   attachments?: Array  - Attachments (base64 encoded)
 *   isDraft?: boolean    - If true, creates a draft instead of sending
 * }
 */
export const sendEmail = async (req: Request, res: Response) => {
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
    
    // Extract email data from request body
    const { 
      to, 
      subject, 
      body, 
      cc, 
      bcc, 
      attachments = [], 
      isDraft = false 
    } = req.body;
    
    // Validate required fields
    if (!to) {
      return res.status(400).json({ error: 'Recipient (to) is required' });
    }
    
    if (!subject) {
      return res.status(400).json({ error: 'Subject is required' });
    }
    
    if (!body) {
      return res.status(400).json({ error: 'Email body is required' });
    }
    
    // Create Gmail client with the provided access token
    const gmail = createGmailClientWithToken(accessToken);
    
    // Prepare email content
    let emailContent = [
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `To: ${to}`,
      `Subject: ${subject}`
    ];
    
    // Add CC and BCC if provided
    if (cc) {
      emailContent.push(`Cc: ${cc}`);
    }
    
    if (bcc) {
      emailContent.push(`Bcc: ${bcc}`);
    }
    
    // Complete the email with body
    emailContent = emailContent.concat(['', body]);
    
    // Convert email to base64 format
    const encodedEmail = Buffer.from(emailContent.join('\r\n'))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    let response;
    
    if (isDraft) {
      // Create draft email
      response = await gmail.users.drafts.create({
        userId: 'me',
        requestBody: {
          message: {
            raw: encodedEmail
          }
        }
      });
      
      res.json({
        success: true,
        message: 'Draft created successfully',
        draftId: response.data.id,
        data: response.data
      });
    } else {
      // Send email
      response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedEmail
        }
      });
      
      res.json({
        success: true,
        message: 'Email sent successfully',
        messageId: response.data.id,
        threadId: response.data.threadId,
        data: response.data
      });
    }
    
  } catch (error) {
    handleGmailError(error, res);
  }
};

/**
 * Creates an email draft
 * This is an alias for sendEmail with isDraft=true
 */
export const createDraft = async (req: Request, res: Response) => {
  req.body.isDraft = true;
  return sendEmail(req, res);
};
