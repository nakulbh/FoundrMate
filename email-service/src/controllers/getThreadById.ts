import { Request, Response } from 'express';
import { createGmailClientWithToken } from '../gmailClient';
import { handleGmailError } from './email.controller';


export const getThreadById = async (req: Request, res: Response) => {
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

    const response = await gmail.users.threads.get({
      userId: 'me',
      id: id,
    });

    if (!response.data) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    const threadData = response.data;
    const { messages, snippet } = threadData;

    res.json({
      success: true,
      threadId: id,
      messages,
      snippet,
    });

  } catch (error) {
    handleGmailError(error, res);
  }
};