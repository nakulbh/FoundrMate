// src/route.ts
import express, { Router, Request, Response, NextFunction } from 'express';
import { 
  getEmails, 
  getEmailsWithToken, 
  getFullEmail,
  getAttachment,
  trashEmail,
  untrashEmail,
  modifyEmailLabels,
  batchModifyEmailLabels
} from './controllers/email.controller';
import { getEmailById } from './controllers/getEmailById';

// Type for request handlers to ensure proper typing
type RequestHandler = (req: Request, res: Response, next?: NextFunction) => Promise<any> | void;

// Create a new router instance
const router = Router();

// Basic email operations with server-side auth
// GET /email/list - List emails with optional query parameters:
// - maxResults: Maximum number of messages to return (default: 10)
// - q: Query string in Gmail search format
// - pageToken: Token for pagination
// - labelIds: Comma-separated list of label IDs to filter by
// - includeSpamTrash: Whether to include messages from spam and trash
router.get('/list', getEmails as RequestHandler);

// Email operations with client-provided access token
// POST /email/list-with-token - List emails with client's OAuth token
// Send oauth_token in the request body or as Authorization header
// Supports the same query parameters as the /list route
router.post('/list-with-token', getEmailsWithToken as RequestHandler);

router.get('/get-email/:id', getEmailById as RequestHandler);
router.get('/full-thread/:id', getFullEmail as RequestHandler);
router.get('/get-thread/', getFullEmail as RequestHandler);

// Uncomment other routes as needed later

// Export the router
export default router;