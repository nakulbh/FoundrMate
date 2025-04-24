import { Request, Response } from 'express';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as process from 'process';
import { authenticate } from '@google-cloud/local-auth';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

// If modifying these scopes, delete token.json
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.send'
];

// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first time
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist(): Promise<OAuth2Client|null> {
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
async function saveCredentials(client: OAuth2Client): Promise<void> {
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
 * API endpoint to initiate OAuth flow and authorize the application
 */
export const authorize = async (req: Request, res: Response) => {
  try {
    // Check if we already have a token
    const existingClient = await loadSavedCredentialsIfExist();
    if (existingClient) {
      return res.json({
        success: true,
        message: 'Already authorized',
        authorized: true
      });
    }

    // We need to redirect to the Google OAuth consent screen
    // But first, we'll provide information about the authorization process
    res.json({
      success: true,
      message: 'Authorization required',
      authorized: false,
      authUrl: '/gmail-auth/start-auth' // Endpoint to start the actual auth flow
    });
  } catch (error) {
    console.error('Authorization error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during authorization check',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * API endpoint to start the actual OAuth flow
 * This is separated from the authorize endpoint because it will redirect the user
 */
export const startAuthFlow = async (req: Request, res: Response) => {
  try {
    // Start the OAuth flow
    const client = await authenticate({
      scopes: SCOPES,
      keyfilePath: CREDENTIALS_PATH,
      // The local-auth library will handle the redirect and callback
    }) as OAuth2Client;
    
    if (client.credentials) {
      await saveCredentials(client);
      res.redirect('/gmail-auth/auth-success');
    } else {
      res.redirect('/gmail-auth/auth-failure');
    }
  } catch (error) {
    console.error('Auth flow error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during authentication flow',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * API endpoint to confirm successful authentication
 */
export const authSuccess = (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Authentication successful',
    authorized: true
  });
};

/**
 * API endpoint to handle authentication failure
 */
export const authFailure = (req: Request, res: Response) => {
  res.status(401).json({
    success: false,
    message: 'Authentication failed',
    authorized: false
  });
};

/**
 * API endpoint to get the access token
 */
export const getAccessToken = async (req: Request, res: Response) => {
  try {
    const client = await loadSavedCredentialsIfExist();
    if (!client) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. Please authorize first.',
        authorized: false
      });
    }

    // Get the access token
    const tokens = client.credentials;
    
    res.json({
      success: true,
      accessToken: tokens.access_token,
      expiryDate: tokens.expiry_date,
      authorized: true
    });
  } catch (error) {
    console.error('Get token error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting access token',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};
