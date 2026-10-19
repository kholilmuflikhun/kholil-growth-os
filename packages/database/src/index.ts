import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/client";

const globalForPrisma = globalThis as unknown as { kholilPrisma?: PrismaClient };
function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL wajib diatur untuk mengakses database.");
  const adapter = new PrismaPg({ connectionString, max: Number(process.env.DATABASE_POOL_MAX || 5), connectionTimeoutMillis: 5000, idleTimeoutMillis: 30000 });
  return new PrismaClient({ adapter });
}
export const prisma = globalForPrisma.kholilPrisma ?? createPrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.kholilPrisma = prisma;
