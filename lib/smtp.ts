import fs from "fs/promises";
import nodemailer from "nodemailer";
import type Mail from "nodemailer/lib/mailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { CONTACT_EMAIL, FROM_EMAIL } from "@/lib/site";

export type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
};

function stripEnvQuotes(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

export function getSmtpConfig(): SmtpConfig {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER ? stripEnvQuotes(process.env.SMTP_USER) : undefined;
  const pass = process.env.SMTP_PASS ? stripEnvQuotes(process.env.SMTP_PASS) : undefined;

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

export function getSmtpHostForDiagnostics(): string | null {
  return process.env.SMTP_HOST?.trim() ?? null;
}

export function getFromAddress(): string {
  const from = process.env.SMTP_FROM ? stripEnvQuotes(process.env.SMTP_FROM) : FROM_EMAIL;
  return from.includes("<") ? from : `Dreamy Tales <${from}>`;
}

function buildTransportOptions(config: SmtpConfig): SMTPTransport.Options {
  const rejectUnauthorized = process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== "false";

  return {
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 20_000,
    tls: {
      minVersion: "TLSv1.2",
      rejectUnauthorized,
    },
    ...(config.secure
      ? {}
      : {
          requireTLS: process.env.SMTP_REQUIRE_TLS !== "false",
        }),
  };
}

let transport: nodemailer.Transporter | null = null;
let transportKey: string | null = null;

function getTransport(): nodemailer.Transporter {
  const config = getSmtpConfig();
  const key = `${config.host}:${config.port}:${config.secure}:${config.user}`;

  if (transport && transportKey === key) {
    return transport;
  }

  transport = nodemailer.createTransport(buildTransportOptions(config));
  transportKey = key;
  return transport;
}

export function resetSmtpTransport(): void {
  transport = null;
  transportKey = null;
}

export async function verifySmtpConnection(): Promise<void> {
  const transporter = getTransport();
  await transporter.verify();
}

export async function sendSmtpMail(options: Mail.Options): Promise<void> {
  try {
    const transporter = getTransport();
    await transporter.sendMail({
      from: getFromAddress(),
      ...options,
    });
  } catch (error) {
    resetSmtpTransport();
    throw error;
  }
}

export async function sendTestEmail(to: string): Promise<void> {
  await sendSmtpMail({
    to,
    subject: "Dreamy Tales SMTP test",
    html: `
      <p>This is a test email from Dreamy Tales.</p>
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

export function formatSmtpError(error: unknown): string {
  if (error instanceof Error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code) return `${error.message} (${code})`;
    return error.message;
  }
  return String(error);
}
