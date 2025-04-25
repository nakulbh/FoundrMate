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
import { getMessageById } from './controllers/getMessageById';
import { getThreadById } from './controllers/getThreadById';
import { getThreads } from './controllers/getThreads';
import { getMessages } from './controllers/getMessages';
import { getMessageWithQuery } from './controllers/getMessageWithQuery';
import { sendEmail, createDraft } from './controllers/sendEmail';

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
// router.get('/list', getEmails as RequestHandler);

// Email operations with client-provided access token
// POST /email/list-with-token - List emails with client's OAuth token
// Send oauth_token in the request body or as Authorization header
// Supports the same query parameters as the /list route

// Basic message operations
router.get('/get-message', getMessages as RequestHandler);
router.get('/get-message/:id', getMessageById as RequestHandler);
router.get('/get-threads/', getThreads as RequestHandler);
router.get('/get-thread/:id', getThreadById as RequestHandler);
router.get('/get-attachment/:messageId/:attachmentId', getAttachment as RequestHandler);

// Enhanced message filtering endpoint
// Can be called with: /filter-messages?labelId=INBOX&q=search&filter=important|other|all
// or with system labels: /filter-messages?labelId=STARRED or labelId=SENT or labelId=DRAFT
router.get('/filter-messages', getMessageWithQuery as RequestHandler);

// Legacy path structure maintained for compatibility
router.get('/getMessage/:labelId/:query', getMessageWithQuery as RequestHandler);

// Email sending operations
router.post('/send-email', sendEmail as RequestHandler);
router.post('/create-draft', createDraft as RequestHandler);

// Unified email API endpoint - handles both sending and retrieving emails
// Supports both GET and POST operations on the same endpoint
// GET: retrieves emails with query parameters
// POST: sends an email or creates a draft
// Since the router is mounted at '/email' in index.ts, we use '/' here
router.route('/')
  .get(getMessageWithQuery as RequestHandler)
  .post(sendEmail as RequestHandler);
  
export default router;
