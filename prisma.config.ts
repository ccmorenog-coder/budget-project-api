import { defineConfig } from "prisma/config";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

export default defineConfig({
  earlyAccess: true,
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts",
  },
  datasource: {
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  },
});
