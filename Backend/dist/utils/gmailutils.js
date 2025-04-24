"use strict";
// src/utils/gmailUtils.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.encodeMessage = exports.formatRawEmail = void 0;
const formatRawEmail = (to, subject, body) => {
    return [
        `To: ${to}`,
        `Subject: ${subject}`,
        `Content-Type: text/plain; charset="UTF-8"`,
        '',
        body,
    ].join('\n');
};
exports.formatRawEmail = formatRawEmail;
const encodeMessage = (rawMessage) => {
    return Buffer.from(rawMessage).toString('base64');
};
exports.encodeMessage = encodeMessage;
