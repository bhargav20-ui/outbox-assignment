import nodemailer, { Transporter } from 'nodemailer';
import { config } from '../config';

let transporter: Transporter | null = null;

export async function getTransporter(): Promise<Transporter> {
  if (transporter) return transporter;

  let user = config.smtp.user;
  let pass = config.smtp.pass;

  if (!user || !pass) {
    console.log('[SMTP] Generating ephemeral Ethereal Email test account...');
    const testAccount = await nodemailer.createTestAccount();
    user = testAccount.user;
    pass = testAccount.pass;
    console.log(`[SMTP] Created Ethereal account: ${user}`);
  }

  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: { user, pass },
  });

  return transporter;
}

export interface SendResult {
  messageId: string;
  previewUrl: string | false;
}

export async function sendMail(options: {
  from: string;
  to: string;
  subject: string;
  text: string;
}): Promise<SendResult> {
  const transport = await getTransporter();
  const info = await transport.sendMail({
    from: options.from,
    to: options.to,
    subject: options.subject,
    text: options.text,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  return {
    messageId: info.messageId,
    previewUrl,
  };
}
