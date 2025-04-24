import * as fs from 'fs/promises';
import * as path from 'path';
import * as process from 'process';
import { authenticate } from '@google-cloud/local-auth';
import { google } from 'googleapis';
import { OAuth2Client, Credentials } from 'google-auth-library';

// If modifying these scopes, delete token.json.
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.send'
];

// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first time.
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
export async function loadSavedCredentialsIfExist(): Promise<OAuth2Client|null> {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content.toString());
    return google.auth.fromJSON(credentials) as OAuth2Client;
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file compatible with GoogleAuth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
export async function saveCredentials(client: OAuth2Client): Promise<void> {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content.toString());
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request authorization to call APIs.
 *
 * @return {Promise<OAuth2Client>}
 */
export async function authorize(): Promise<OAuth2Client> {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  }) as OAuth2Client;
  
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

/**
 * Get Gmail client with authorized OAuth2 client
 * 
 * @return {Promise<import('googleapis').gmail_v1.Gmail>}
 */
export async function getGmailClient() {
  const auth = await authorize();
  return google.gmail({ version: 'v1', auth });
}

/**
 * Create a Gmail client using an existing access token
 * 
 * @param {string} accessToken - The OAuth2 access token
 * @param {string} [clientId] - Optional client ID from your Google Cloud project
 * @param {string} [clientSecret] - Optional client secret from your Google Cloud project
 * @return {import('googleapis').gmail_v1.Gmail}
 */
export function createGmailClientWithToken(accessToken: string, clientId?: string, clientSecret?: string) {
  // Create an OAuth2 client
  const oauth2Client = new OAuth2Client({
    clientId: clientId || process.env.GOOGLE_CLIENT_ID,
    clientSecret: clientSecret || process.env.GOOGLE_CLIENT_SECRET
  });
  
  // Set credentials directly with the access token
  oauth2Client.setCredentials({
    access_token: accessToken
  });
  
  // Return the Gmail client
  return google.gmail({ version: 'v1', auth: oauth2Client });
}
