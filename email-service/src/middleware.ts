import { Request, Response, NextFunction } from 'express';

// Extend the Express Request interface to include our custom properties
declare global {
  namespace Express {
    interface Request {
      accessToken?: string;
      user?: { accessToken: string };
    }
  }
}

export function extractAccessToken(req: Request, res: Response, next: NextFunction) {
  let accessToken = req.body?.accessToken || req.body?.oauth_token;

  // If not in body, check query params
  if (!accessToken && req.query.oauth_token) {
    accessToken = req.query.oauth_token as string;
  }

  // If not in body or query, check authorization header
  if (!accessToken && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      accessToken = authHeader.substring(7);
    }
  }

  if (!accessToken) {
    return res.status(400).json({
      error: 'OAuth token is required. Provide it in the request body, query parameter, or Authorization header',
    });
  }

  // Attach the token to the request object for downstream use
  req.accessToken = accessToken;

  next();
}
