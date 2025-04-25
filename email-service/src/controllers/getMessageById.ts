import { Request, Response } from 'express';
import { createGmailClientWithToken } from '../gmailClient';
import { handleGmailError } from './email.controller';
import { Buffer } from 'buffer';

function decodeBase64Url(data: string): string {
  return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
}

function extractBody(payload: any): { html?: string; text?: string } {
  let body: { html?: string; text?: string } = { html: undefined, text: undefined };
  const parts = payload.parts || [payload]; // If not multipart, treat payload as a single part

  for (const part of parts) {
    const mimeType = part.mimeType;
    const data = part.body?.data;

    if (data) {
      const decoded = decodeBase64Url(data);
      if (mimeType === 'text/plain') {
        body.text = decoded as any;
      } else if (mimeType === 'text/html') {
        body.html = decoded as any;
      }
    }

    // If nested parts exist, recurse into them
    if (part.parts && part.parts.length > 0) {
      const nested = extractBody(part);
      body = { ...body, ...nested };
    }
  }

  return body;
}

// Helper to extract attachments from a payload's parts
function extractAttachments(parts: any[]): any[] {
  let result: any[] = [];
  if (!parts) return result;
  for (const part of parts) {
    if (part.filename && part.filename.length > 0 && part.body && part.body.attachmentId) {
      result.push({
        filename: part.filename,
        mimeType: part.mimeType,
        attachmentId: part.body.attachmentId,
        size: part.body.size,
      });
    }
    if (part.parts) {
      result = result.concat(extractAttachments(part.parts));
    }
  }
  return result;
}

export const getMessageById = async (req: Request, res: Response) => {
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

    const response = await gmail.users.messages.get({
      userId: 'me',
      id: id,
      format: 'full',
    });

    if (!response.data) {
      return res.status(404).json({ error: 'Email not found' });
    }

    const emailData = response.data;
    const { payload, snippet } = emailData;

    // Extract body and attachments
    const body = extractBody(payload);
    const attachments = extractAttachments(payload?.parts || []);

    res.json({
      success: true,
      emailId: id,
      subject: payload?.headers?.find((h: any) => h.name === 'Subject')?.value || '',
      from: payload?.headers?.find((h: any) => h.name === 'From')?.value || '',
      to: payload?.headers?.find((h: any) => h.name === 'To')?.value || '',
      snippet,
      body,
      attachments,
    });

  } catch (error) {
    handleGmailError(error, res);
  }
};