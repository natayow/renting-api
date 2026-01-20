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
export const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
export const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || "";
export const MIDTRANS_CLIENT_KEY = process.env.MIDTRANS_CLIENT_KEY || "";
export const NODEMAILER_USER = process.env.NODEMAILER_USER as string || "nathasya1616@gmail.com";
export const NODEMAILER_PASSWORD = process.env.NODEMAILER_PASSWORD as string || "zausjbwjryunakmm";
export const LINK_VERIFICATION = (process.env.LINK_VERIFICATION as string || "http://localhost:3000/verify-email").trim().replace(/^["']|["'];?$/g, '');
export const JWT_VERIFY_EMAIL = (process.env.JWT_VERIFY_EMAIL as string || "jcwdbsdam35verifyemail").trim().replace(/^["']|["'];?$/g, '');


