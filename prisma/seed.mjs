import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const seedAccounts = [
    {
      code: "1010",
      name: "Cash on Hand",
      type: "ASSET",
      normalBalance: "DEBIT",
    },
    {
      code: "4010",
      name: "Service Revenue",
      type: "REVENUE",
      normalBalance: "CREDIT",
    },
    {
      code: "5010",
      name: "Operating Expense",
      type: "EXPENSE",
      normalBalance: "DEBIT",
    },
  ];

  for (const account of seedAccounts) {
    await prisma.chartOfAccount.upsert({
      where: { code: account.code },
      update: {
        name: account.name,
        type: account.type,
        normalBalance: account.normalBalance,
      },
      create: account,
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
