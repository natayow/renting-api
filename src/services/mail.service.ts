import { emailTransporter } from '../utils/nodemailer-transporter';
import fs from 'fs/promises';
import path from 'path';
import Handlebars from 'handlebars';
import { jwtSign } from '../utils/jwt-sign';
import { LINK_VERIFICATION } from '../config/main.config';

export async function sendMailService({
  to,
  subject,
  templateName,
  replaceable,
}: {
  to: string;
  subject: string;
  templateName: string;
  replaceable: any;
}) {
  const templateDir = path.resolve(__dirname, '../templates');

  const templatePath = path.join(templateDir, `${templateName}.html`);

  const templateSource = await fs.readFile(templatePath, 'utf8');

  const templateCompiled = await Handlebars.compile(templateSource);

  const templateHtml = templateCompiled(replaceable);

  await emailTransporter.sendMail({
    subject,
    to,
    html: templateHtml,
  });
}

export async function sendInvoiceEmail({
  to,
  bookingDetails,
}: {
  to: string;
  bookingDetails: {
    bookingId: string;
    customerName: string;
    propertyName: string;
    propertyLocation: string;
    roomName?: string;
    checkInDate: string;
    checkOutDate: string;
    nights: number;
    guestsCount: number;
    nightlySubtotal: string;
    cleaningFee: string;
    serviceFee: string;
    discount: string;
    totalPrice: string;
    paymentMethod: string;
    paidAt: string;
  };
}) {
  await sendMailService({
    to,
    subject: 'Booking Confirmation & Invoice',
    templateName: 'invoice',
    replaceable: bookingDetails,
  });
}