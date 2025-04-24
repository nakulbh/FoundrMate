"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEmails = void 0;
const googleapis_1 = require("googleapis");
// Helper to decode base64 email body
const decodeBody = (body) => {
    return Buffer.from(body, 'base64').toString('utf-8');
};
// Helper to extract plain text email body from Gmail payload
const getEmailBody = (payload) => {
    var _a;
    if (!payload)
        return '';
    if (payload.body && payload.body.data) {
        return decodeBody(payload.body.data);
    }
    const parts = payload.parts || [];
    for (const part of parts) {
        if (part.mimeType === 'text/plain' && ((_a = part.body) === null || _a === void 0 ? void 0 : _a.data)) {
            return decodeBody(part.body.data);
        }
        // Recursively search nested parts
        if (part.parts) {
            const nestedBody = getEmailBody(part);
            if (nestedBody)
                return nestedBody;
        }
    }
    return '';
};
const getEmails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const accessToken = req.accessToken || (req.user && req.user.accessToken);
        if (!accessToken) {
            res.status(401).json({ error: 'Access token not found' });
            return;
        }
        const oauth2Client = new googleapis_1.google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: accessToken });
        const gmail = googleapis_1.google.gmail({ version: 'v1', auth: oauth2Client });
        const allEmails = [];
        const fetchEmails = (pageToken) => __awaiter(void 0, void 0, void 0, function* () {
            const emailList = yield gmail.users.messages.list({
                userId: 'me',
                maxResults: 100,
                pageToken,
            });
            if (!emailList.data.messages || emailList.data.messages.length === 0) {
                return;
            }
            const batchEmails = yield Promise.all(emailList.data.messages.map((message) => __awaiter(void 0, void 0, void 0, function* () {
                var _a, _b, _c, _d;
                if (!message.id)
                    throw new Error('Message ID is missing');
                const email = yield gmail.users.messages.get({
                    userId: 'me',
                    id: message.id,
                    format: 'full',
                });
                const headers = ((_a = email.data.payload) === null || _a === void 0 ? void 0 : _a.headers) || [];
                const subject = ((_b = headers.find((h) => { var _a; return ((_a = h.name) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === 'subject'; })) === null || _b === void 0 ? void 0 : _b.value) || 'No Subject';
                const from = ((_c = headers.find((h) => { var _a; return ((_a = h.name) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === 'from'; })) === null || _c === void 0 ? void 0 : _c.value) || 'Unknown Sender';
                const date = ((_d = headers.find((h) => { var _a; return ((_a = h.name) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === 'date'; })) === null || _d === void 0 ? void 0 : _d.value) || '';
                const body = getEmailBody(email.data.payload);
                return {
                    id: email.data.id || '',
                    subject,
                    from,
                    date,
                    snippet: email.data.snippet || '',
                    body,
                };
            })));
            allEmails.push(...batchEmails);
            if (emailList.data.nextPageToken) {
                yield fetchEmails(emailList.data.nextPageToken);
            }
        });
        yield fetchEmails();
        res.json({ emails: allEmails });
    }
    catch (error) {
        console.error('Error fetching emails:', error);
        res.status(error.code || 500).json({
            error: error.message || 'Failed to fetch emails',
            details: error.errors || [],
        });
    }
});
exports.getEmails = getEmails;
