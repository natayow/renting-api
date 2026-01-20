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

  console.log('📧 Sending email:');
  console.log('  To:', to);
  console.log('  Subject:', subject);
  console.log('  Template:', templateName);
  if (replaceable.linkVerification) {
    console.log('  🔗 Verification Link in Email:', replaceable.linkVerification);
  }

  await emailTransporter.sendMail({
    subject,
    to,
    html: templateHtml,
  });

  console.log('  ✅ Email sent successfully!');
}