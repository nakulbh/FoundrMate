// src/routes/emailRoutes.ts
import { Router } from 'express';
import { getEmails, getEmailById, createDraftReply } from '../controllers/email.controller';

const router = Router();

// With the new Gmail authentication approach, we don't need the isAuthenticated middleware
// as authentication is handled through the Google OAuth flow in the gmailAuth.ts file

router.get('/list', getEmails);
// router.get('/:id', getEmailById);
// router.post('/draft-reply', createDraftReply);

export default router;