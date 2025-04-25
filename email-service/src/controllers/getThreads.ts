import { Request, Response } from 'express';
import { createGmailClientWithToken } from '../gmailClient';
import { handleGmailError } from './email.controller';


export const getThreads = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const accessToken = req.accessToken;

    if (!id) {
      return res.status(400).json({ error: 'Email ID is required' });
    }
    if (!accessToken) {
      return res.status(400).json({ error: 'Access token is required' });
    }

    const gmail = createGmailClientWithToken(accessToken);

    const response = await gmail.users.threads.list({
      userId: 'me',
    });

    if (!response.data) {
      return res.status(404).json({ error: 'Threads not found' });
    }

    const threads = response.data.threads || [];
    res.json({
      success: true,
      threads
    });

  } catch (error) {
    handleGmailError(error, res);
  }
};