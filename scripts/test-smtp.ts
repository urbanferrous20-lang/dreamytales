/**
 * Test SMTP from Plesk (Node.js → Run Node.js commands):
 *   npm run smtp:test -- Admin@dreamytales.co.za
 */
import { formatSmtpError, getFromAddress, getSmtpConfig, sendTestEmail, verifySmtpConnection } from "../lib/smtp";

async function main() {
  const to = process.argv[2]?.trim();
  if (!to) {
    console.error('Usage: npm run smtp:test -- "recipient@example.com"');
    process.exit(1);
  }

  const config = getSmtpConfig();
  console.log("SMTP configuration:");
  console.log(`  host: ${config.host}`);
  console.log(`  port: ${config.port}`);
  console.log(`  secure: ${config.secure}`);
  console.log(`  user: ${config.user}`);
  console.log(`  from: ${getFromAddress()}`);
  console.log(`  to: ${to}`);

  console.log("\nVerifying SMTP connection...");
  await verifySmtpConnection();
  console.log("SMTP connection OK.");

  console.log("Sending test email...");
  await sendTestEmail(to);
  console.log("Test email sent.");
}

main().catch((error) => {
  console.error("\nSMTP test failed:");
  console.error(formatSmtpError(error));
  process.exit(1);
});
