import { Request, Response } from 'express';
import { createGmailClientWithToken } from '../gmailClient';
import { handleGmailError } from './email.controller';

export const getAttachment = async (req: Request, res: Response) => {
  try {
    const { userId, messageId, attachmentId } = req.params;
    const accessToken = req.accessToken;

    if (!userId || !messageId || !attachmentId) {
      return res.status(400).json({ error: 'userId, messageId, and attachmentId are required' });
    }
    if (!accessToken) {
      return res.status(400).json({ error: 'Access token is required' });
    }

    const gmail = createGmailClientWithToken(accessToken);

    const response = await gmail.users.messages.attachments.get({
      userId,
      messageId,
      id: attachmentId,
    });

    if (!response.data) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    res.json({
      success: true,
      attachment: response.data,
    });
  } catch (error) {
    handleGmailError(error, res);
  }
};