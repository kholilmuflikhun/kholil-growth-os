/**
 * Development seed only. Never seed fabricated financial/customer data into production.
 * The first admin must be created through a secure bootstrap flow, not a predictable password.
 */
import { prisma } from "@kholil/database";

async function main() {
  await prisma.goal.upsert({
    where: { id: "initial-monthly-target" },
    update: {},
    create: {
      id: "initial-monthly-target",
      name: "Target pendapatan operasional bulanan",
      metric: "NET_OPERATING_CONTRIBUTION",
      targetValue: "5200000",
      currency: "IDR",
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
      activeDays: 26,
      status: "ACTIVE",
    },
  });
  console.log("Development goal seeded. No admin or fake customer data was created.");
}
main().finally(async () => prisma.$disconnect());
