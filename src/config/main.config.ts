import dotenv from 'dotenv';
import path from 'path';

dotenv.config({
  path: path.resolve(process.cwd(), '.env'),
});

export const CORS_WHITELIST_URL_1 = process.env.CORS_WHITELIST_URL_1 || "http://localhost:3000";
export const CORS_WHITELIST_URL_2 = process.env.CORS_WHITELIST_URL_2 || "http://localhost:3001";
export const NEXTAUTH_INTERNAL_SECRET = process.env.NEXTAUTH_INTERNAL_SECRET || "nextauth2025";
export const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY as string || "jcwdbsdam35";
export const JWT_SECRET_KEY_OTHER = process.env.JWT_SECRET_KEY_OTHER as string || "jcwdbsdam35other";

