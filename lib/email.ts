import "server-only";
import { Resend } from "resend";
import fs from "fs/promises";
import { CONTACT_EMAIL, FROM_EMAIL } from "@/lib/site";

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not configured");
  return new Resend(key);
}

function getFromEmail(): string {
  return process.env.RESEND_FROM_EMAIL ?? FROM_EMAIL;
}

export async function sendStoryEmail(params: {
  to: string;
  parentName: string;
  childName: string;
  storyTitle: string;
  teaser: string;
  pdfPath: string;
  manageUrl: string;
}): Promise<void> {
  const resend = getResend();
  const pdfBuffer = await fs.readFile(params.pdfPath);

  await resend.emails.send({
    from: getFromEmail(),
    to: params.to,
    subject: `Tonight's story for ${params.childName}: ${params.storyTitle}`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #1e293b;">
        <p>Hi ${params.parentName},</p>
        <p>${params.teaser}</p>
        <p>Your illustrated bedtime short story for <strong>${params.childName}</strong> is attached as a PDF — perfect for tonight's read-aloud at 6pm.</p>
        <p style="color: #64748b; font-size: 14px;">
          <a href="${params.manageUrl}">Manage your subscription</a>
        </p>
        <p style="color: #64748b; font-size: 14px;">Sweet dreams from Dreamy Tales.</p>
      </div>
    `,
    attachments: [
      {
        filename: `${params.storyTitle.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.pdf`,
        content: pdfBuffer,
      },
    ],
  });
}

export async function sendCancellationEmail(params: {
  to: string;
  parentName: string;
  accessEndsAt: Date;
}): Promise<void> {
  const resend = getResend();
  const endDate = params.accessEndsAt.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  await resend.emails.send({
    from: getFromEmail(),
    to: params.to,
    subject: "Your Dreamy Tales cancellation is confirmed",
    html: `
      <p>Hi ${params.parentName},</p>
      <p>We've received your cancellation request. Your bedtime short stories will continue until <strong>${endDate}</strong>.</p>
      <p>You will not be charged after that date.</p>
      <p>We hope to see you again under the stars someday.</p>
    `,
  });
}

export async function sendAdminAlert(subject: string, message: string): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL ?? CONTACT_EMAIL;
  if (!adminEmail || !process.env.RESEND_API_KEY) return;

  const resend = getResend();
  await resend.emails.send({
    from: getFromEmail(),
    to: adminEmail,
    subject: `[Dreamy Tales] ${subject}`,
    html: `<pre>${message}</pre>`,
  });
}
