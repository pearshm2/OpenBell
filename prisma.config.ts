import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Neon: use the direct (non-pooled) URL for migrations when provided.
    url: process.env.DIRECT_URL || process.env.DATABASE_URL,
  },
});
