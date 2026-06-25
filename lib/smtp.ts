import fs from "fs/promises";
import nodemailer from "nodemailer";
import type Mail from "nodemailer/lib/mailer";
import { CONTACT_EMAIL, FROM_EMAIL } from "@/lib/site";

function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    throw new Error("SMTP_HOST, SMTP_USER, and SMTP_PASS must be configured");
  }

  const port = Number(process.env.SMTP_PORT ?? "465");
  const secure =
    process.env.SMTP_SECURE !== undefined
      ? process.env.SMTP_SECURE === "true"
      : port === 465;

  return { host, port, secure, user, pass };
}

export function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export function getFromAddress(): string {
  return process.env.SMTP_FROM ?? FROM_EMAIL;
}

let transport: nodemailer.Transporter | null = null;

function getTransport(): nodemailer.Transporter {
  if (transport) return transport;

  const { host, port, secure, user, pass } = getSmtpConfig();
  transport = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    tls: secure ? undefined : { minVersion: "TLSv1.2" },
  });

  return transport;
}

export async function sendSmtpMail(options: Mail.Options): Promise<void> {
  const transporter = getTransport();
  await transporter.sendMail({
    from: getFromAddress(),
    ...options,
  });
}

export async function sendTestEmail(to: string): Promise<void> {
  await sendSmtpMail({
    to,
    subject: "Dreamy Tales SMTP test",
    html: `
      <p>This is a test email from Dreamy Tales on 1-grid SMTP.</p>
      <p>If you received this, outgoing mail is configured correctly.</p>
    `,
  });
}

export async function sendPdfEmail(params: {
  to: string;
  subject: string;
  html: string;
  pdfPath: string;
  filename: string;
}): Promise<void> {
  const pdfBuffer = await fs.readFile(params.pdfPath);
  await sendSmtpMail({
    to: params.to,
    subject: params.subject,
    html: params.html,
    attachments: [{ filename: params.filename, content: pdfBuffer }],
  });
}

export async function sendAdminAlert(subject: string, message: string): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL ?? CONTACT_EMAIL;
  if (!adminEmail || !isSmtpConfigured()) return;

  try {
    await sendSmtpMail({
      to: adminEmail,
      subject: `[Dreamy Tales] ${subject}`,
      html: `<pre>${message}</pre>`,
    });
  } catch {
    // Alert failure should not break background jobs
  }
}
