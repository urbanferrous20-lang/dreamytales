/**
 * Generate a bcrypt hash for ADMIN_PASSWORD_HASH.
 * Run: npm run admin:hash-password -- "your-secure-password"
 */
import bcrypt from "bcryptjs";

const password = process.argv[2];
if (!password) {
  console.error('Usage: npm run admin:hash-password -- "your-password"');
  process.exit(1);
}

bcrypt.hash(password, 12).then((hash) => {
  const b64 = Buffer.from(hash).toString("base64");
  console.log("\nAdd ONE of these to .env.local / Plesk:\n");
  console.log("# Easiest for local dev (server-only, never commit):");
  console.log(`ADMIN_PASSWORD=${password}\n`);
  console.log("# Safer for production (bcrypt hash without $ characters):");
  console.log(`ADMIN_PASSWORD_HASH_B64=${b64}\n`);
});
