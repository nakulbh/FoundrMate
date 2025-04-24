"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGmailClient = void 0;
const googleapis_1 = require("googleapis");
// Create a Gmail client using OAuth credentials
const createGmailClient = (accessToken) => {
    const oauth2Client = new googleapis_1.google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    return googleapis_1.google.gmail({
        version: 'v1',
        auth: oauth2Client,
    });
};
exports.createGmailClient = createGmailClient;
