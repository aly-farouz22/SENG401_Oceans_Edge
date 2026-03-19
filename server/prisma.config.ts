import { defineConfig } from "prisma";

export default defineConfig({
  datasources: {
    db: {
      adapter: "postgresql",
      url: process.env.DATABASE_URL,
    },
  },
});