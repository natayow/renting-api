import nodemailer from 'nodemailer';
import { NODEMAILER_PASSWORD, NODEMAILER_USER } from '../config/main.config';

export const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: "nathasya1616@gmail.com",
    pass: "zausjbwjryunakmm",
  },
  tls: {
    rejectUnauthorized: false,
  },
});