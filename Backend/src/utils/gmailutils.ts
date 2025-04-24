// src/utils/gmailUtils.ts

export const formatRawEmail = (to: string, subject: string, body: string): string => {
    return [
      `To: ${to}`,
      `Subject: ${subject}`,
      `Content-Type: text/plain; charset="UTF-8"`,
      '',
      body,
    ].join('\n');
  };
  
  export const encodeMessage = (rawMessage: string): string => {
    return Buffer.from(rawMessage).toString('base64');
  };