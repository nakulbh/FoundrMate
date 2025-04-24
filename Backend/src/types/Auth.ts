import { Request } from 'express';

export interface AuthUser {
  accessToken: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}