import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";
import { randomUUID } from "node:crypto";

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL หรือ DIRECT_URL ยังไม่ถูกตั้งค่า");
  process.exit(1);
}

const defaultPassword =
  process.env.FITNESSLA_SEED_PASSWORD ??
  process.env.REAL_MODE_SEED_PASSWORD ??
  "ChangeMe123!";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const seedUsers = [
  {
    name: "Owner FitnessLA",
    email: "owner@fitnessla.local",
    username: "owner",
    role: "OWNER",
  },
  {
    name: "Admin FitnessLA",
    email: "admin@fitnessla.local",
    username: "admin",
    role: "ADMIN",
  },
  {
    name: "Staff FitnessLA",
    email: "staff@fitnessla.local",
    username: "staff",
    // Current app guard accepts CASHIER for frontline staff.
    role: "CASHIER",
  },
];

const seedChartOfAccounts = [
  { code: "1010", name: "Cash on Hand", type: "ASSET", normalBalance: "DEBIT" },
  { code: "1020", name: "PromptPay Clearing", type: "ASSET", normalBalance: "DEBIT" },
  { code: "4010", name: "Service Revenue", type: "REVENUE", normalBalance: "CREDIT" },
  { code: "4020", name: "Membership Revenue", type: "REVENUE", normalBalance: "CREDIT" },
  { code: "5010", name: "Operating Expense", type: "EXPENSE", normalBalance: "DEBIT" },
  { code: "3010", name: "Owner Equity", type: "EQUITY", normalBalance: "CREDIT" },
];

const seedProducts = [
  { sku: "PT-001", name: "Personal Training Session", price: "1500.00", productType: "SERVICE" },
  { sku: "MEM-001", name: "Monthly Membership", price: "1200.00", productType: "MEMBERSHIP" },
  { sku: "SNK-001", name: "Protein Snack", price: "85.00", productType: "GOODS" },
];

async function upsertCredentialAccount(userId, username, passwordHash) {
  const existingAccount = await prisma.account.findFirst({
    where: {
      userId,
      providerId: "credential",
    },
  });

  if (existingAccount) {
    await prisma.account.update({
      where: { id: existingAccount.id },
      data: {
        accountId: userId,
        password: passwordHash,
        updatedAt: new Date(),
      },
    });
    return;
  }

  await prisma.account.create({
    data: {
      id: `acc-${username}-${randomUUID()}`,
      accountId: userId,
      providerId: "credential",
      userId,
      password: passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

async function seedRealMode() {
  const passwordHash = await hashPassword(defaultPassword);

  for (const user of seedUsers) {
    const upsertedUser = await prisma.user.upsert({
      where: { username: user.username },
      update: {
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: true,
        emailVerified: true,
        updatedAt: new Date(),
      },
      create: {
        id: `user-${user.username}-seed`,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        image: null,
        isActive: true,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await upsertCredentialAccount(upsertedUser.id, user.username, passwordHash);
  }

  for (const account of seedChartOfAccounts) {
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

  for (const product of seedProducts) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {
        name: product.name,
        price: product.price,
        productType: product.productType,
        isActive: true,
      },
      create: {
        ...product,
        isActive: true,
      },
    });
  }

  console.log("Seeded real mode successfully");
  console.log("Users: owner (OWNER), admin (ADMIN), staff (CASHIER)");
  console.log("Default password for all users:", defaultPassword);
  console.log("COA rows:", seedChartOfAccounts.length, "| Products:", seedProducts.length);
}

seedRealMode()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Seeding failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
