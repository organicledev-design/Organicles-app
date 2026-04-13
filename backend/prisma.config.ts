import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node prisma/seed.js",
  },
  datasource: {
    url: process.env.SQLITE_DB_PATH 
      ? `file:${process.env.SQLITE_DB_PATH}` 
      : "file:./prisma/dev.db",
  },
});