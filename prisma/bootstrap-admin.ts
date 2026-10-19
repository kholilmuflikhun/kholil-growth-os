/**
 * Secure one-time admin bootstrap.
 * Required env vars: BOOTSTRAP_ADMIN_USERNAME, BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_PASSWORD.
 * Never use a weak password or run this with an exposed terminal/logging environment.
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "@kholil/database";
async function main() {
  const username = process.env.BOOTSTRAP_ADMIN_USERNAME;
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL;
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  if (!username || !email || !password) throw new Error("Set BOOTSTRAP_ADMIN_USERNAME, BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD.");
  if (password.length < 12 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    throw new Error("Admin password must be at least 12 characters and contain uppercase, lowercase, number and symbol.");
  }
  const existing = await prisma.user.findFirst({ where: { OR: [{ username }, { email }] } });
  if (existing) throw new Error("An account with that username/email already exists. Refusing to overwrite.");
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({ data: { username, email, passwordHash, role: "OWNER", mustChangePassword: false } });
  console.log(`Created administrator ${username} (${email}). Password was hashed and not printed.`);
}
main().finally(async () => prisma.$disconnect());
