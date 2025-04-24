import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

// Initialize Gmail client
export function getGmailClient(accessToken: string) {
  const oauth2Client = new OAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.gmail({ version: 'v1', auth: oauth2Client });
}