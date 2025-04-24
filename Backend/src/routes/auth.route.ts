// src/routes/auth.route.ts
import express, { RequestHandler } from 'express';
import { redirectToGoogle, googleCallback } from '../controllers/auth.controller';

const router = express.Router();

router.get('/google', redirectToGoogle);
router.get('/google/callback', googleCallback as RequestHandler);

export default router;
