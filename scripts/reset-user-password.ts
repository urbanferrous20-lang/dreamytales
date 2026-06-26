/**
 * Reset a parent account password on the server (Plesk SSH / Run Node.js commands).
 * Run: npm run user:reset-password -- "user@email.com" "new-password"
 */
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const email = process.argv[2]?.trim().toLowerCase();
const password = process.argv[3];

if (!email || !password) {
  console.error('Usage: npm run user:reset-password -- "user@email.com" "new-password"');
  process.exit(1);
}

if (password.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`No user found for ${email}`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

  console.log(`Password updated for ${email}`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
