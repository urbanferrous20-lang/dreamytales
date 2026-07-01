import { CONTACT_EMAIL } from "@/lib/site";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildStoryDeliveryEmailHtml(params: {
  parentName: string;
  childName: string;
  storyTitle: string;
  teaser: string;
  manageUrl: string;
  isBirthday?: boolean;
  turningAge?: number;
  includesNarration?: boolean;
}): string {
  const parentName = escapeHtml(params.parentName);
  const childName = escapeHtml(params.childName);
  const storyTitle = escapeHtml(params.storyTitle);
  const teaser = escapeHtml(params.teaser);
  const manageUrl = escapeHtml(params.manageUrl);
  const contactEmail = escapeHtml(CONTACT_EMAIL);
  const birthday = params.isBirthday === true;
  const withAudio = params.includesNarration === true;

  const introBlock = birthday
    ? `<p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #1e2a4a;">
        It&apos;s <strong style="color: #1e2a4a;">${childName}&apos;s birthday</strong>${
          params.turningAge != null
            ? ` &mdash; turning <strong style="color: #1e2a4a;">${params.turningAge}</strong> today`
            : ""
        }! We&apos;ve written a special birthday bedtime story just for them.
      </p>`
    : "";

  const attachmentLabel = withAudio
    ? "PDF storybook + MP3 narration"
    : "PDF storybook";

  const attachmentDetail = withAudio
    ? "Open the illustrated <strong>PDF</strong> for read-aloud time, or play the calm <strong>MP3</strong> narration (with a gentle pause after each page)."
    : birthday
      ? "Your once-a-year <strong>birthday</strong> story is attached &mdash; ready for tonight&apos;s read-aloud."
      : "Your illustrated bedtime story is attached &mdash; perfect for tonight&apos;s read-aloud at 6pm.";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Tonight&apos;s story for ${childName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f0ebe3; font-family: Georgia, 'Times New Roman', serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f0ebe3; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; border-collapse: collapse;">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(180deg, #060b18 0%, #0a1020 40%, #1a2340 100%); border-radius: 16px 16px 0 0; padding: 28px 32px; text-align: center;">
              <p style="margin: 0 0 8px; font-size: 28px; line-height: 1;">&#127769;</p>
              <p style="margin: 0 0 6px; font-size: 22px; font-weight: bold; color: #e8d5a3; letter-spacing: 0.02em;">Dreamy Tales</p>
              <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.18em; color: rgba(250, 246, 240, 0.55);">Personalised bedtime stories</p>
            </td>
          </tr>

          <!-- Gold accent bar -->
          <tr>
            <td style="background-color: #c9a962; height: 4px; font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color: #faf6f0; padding: 32px 32px 24px;">
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #1e2a4a;">Hi ${parentName},</p>
              ${introBlock}
              <p style="margin: 0 0 20px; font-size: 18px; font-weight: bold; line-height: 1.4; color: #1e2a4a;">
                Tonight&apos;s story for ${childName}
              </p>
              <p style="margin: 0 0 20px; font-size: 20px; font-weight: bold; line-height: 1.35; color: #1e2a4a;">
                ${storyTitle}
              </p>
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.65; color: #3d4f6f; font-style: italic; border-left: 3px solid #c9a962; padding-left: 16px;">
                ${teaser}
              </p>

              <!-- Attachment box -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
                <tr>
                  <td style="background-color: #ffffff; border: 1px solid rgba(201, 169, 98, 0.35); border-radius: 12px; padding: 20px;">
                    <p style="margin: 0 0 8px; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; color: #c9a962;">
                      &#128206; Attached tonight
                    </p>
                    <p style="margin: 0 0 8px; font-size: 15px; font-weight: bold; color: #1e2a4a;">
                      ${attachmentLabel}
                    </p>
                    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #4a5a78;">
                      ${attachmentDetail}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Feedback / contact -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
                <tr>
                  <td style="background-color: #eef1f8; border: 1px solid rgba(30, 42, 74, 0.12); border-radius: 12px; padding: 18px 20px;">
                    <p style="margin: 0 0 8px; font-size: 14px; font-weight: bold; color: #1e2a4a;">
                      Not quite right tonight?
                    </p>
                    <p style="margin: 0; font-size: 14px; line-height: 1.65; color: #4a5a78;">
                      If you&apos;re not happy with something in tonight&apos;s story &mdash; the tone, a detail about ${childName}, or anything you&apos;d like us to adjust for future nights &mdash; please get in touch at
                      <a href="mailto:${contactEmail}" style="color: #1e2a4a; font-weight: bold; text-decoration: underline;">${contactEmail}</a>.
                      We&apos;re a small team and we read every message.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #1e2a4a;">
                Sweet dreams,<br />
                <span style="color: #c9a962; font-weight: bold;">The Dreamy Tales team</span>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #1e2a4a; border-radius: 0 0 16px 16px; padding: 20px 32px; text-align: center;">
              <p style="margin: 0 0 10px; font-size: 13px; line-height: 1.5;">
                <a href="${manageUrl}" style="color: #e8d5a3; text-decoration: underline;">Manage your subscription</a>
              </p>
              <p style="margin: 0; font-size: 11px; line-height: 1.5; color: rgba(250, 246, 240, 0.45);">
                dreamytales.co.za &middot; Delivered at 6pm SAST
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
