# FoundrMate Backend

## Gmail API Authentication Setup

This application uses Google's OAuth 2.0 authentication for accessing Gmail API. Follow these steps to set up authentication:

### 1. Create Google Cloud Project and Enable Gmail API

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Gmail API for your project
4. Configure the OAuth consent screen
5. Create OAuth 2.0 credentials (Desktop application type)

### 2. Configure Credentials

1. Download the credentials JSON file from Google Cloud Console
2. Save it as `credentials.json` in the root directory of this project
3. Make sure the file has the following structure:

```json
{
  "installed": {
    "client_id": "YOUR_CLIENT_ID",
    "project_id": "YOUR_PROJECT_ID",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_secret": "YOUR_CLIENT_SECRET",
    "redirect_uris": ["http://localhost"]
  }
}
```

### 3. First-time Authentication

When you run the application for the first time, it will:

1. Check for an existing `token.json` file
2. If not found, open a browser window for you to authenticate with your Google account
3. After authentication, a `token.json` file will be created to store your credentials

**Note:** If you change the API scopes in `src/config/gmailAuth.ts`, delete the `token.json` file to force re-authentication.

## API Endpoints

### Email Routes

- `GET /api/emails/list` - Get a list of emails
- `GET /api/emails/:id` - Get a single email by ID
- `POST /api/emails/draft-reply` - Create a draft reply to an email

## Running the Application

```bash
# Install dependencies
yarn install

# Start the development server
yarn dev
```
