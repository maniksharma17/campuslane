import jwt from 'jsonwebtoken';
import { JwtPayload, AdminJwtPayload } from '../types';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = '7d';

export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const generateAdminToken = (payload: AdminJwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
};

export const verifyAdminToken = (token: string): AdminJwtPayload => {
  return jwt.verify(token, JWT_SECRET) as AdminJwtPayload;
};