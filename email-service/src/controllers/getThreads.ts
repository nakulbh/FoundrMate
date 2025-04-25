import { Request, Response } from 'express';
import { createGmailClientWithToken } from '../gmailClient';
import { handleGmailError } from './email.controller';


export const getThreads = async (req: Request, res: Response) => {
  try {
    const accessToken = req.accessToken;

    if (!accessToken) {
      return res.status(400).json({ error: 'Access token is required' });
    }
    const maxResults = req.query.maxResults ? parseInt(req.query.maxResults as string) : 10;
    const q = req.query.q as string | undefined;
    const pageToken = req.query.pageToken as string | undefined;
    const labelIds = req.query.labelIds as string[] | undefined;
    const includeSpamTrash = req.query.includeSpamTrash as boolean | undefined;

    const gmail = createGmailClientWithToken(accessToken);

    const response = await gmail.users.threads.list({
      userId: 'me',
      maxResults,
      q,
      pageToken,
      labelIds,
      includeSpamTrash
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