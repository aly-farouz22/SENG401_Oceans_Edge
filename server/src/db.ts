// server/src/db.ts
import Prisma from "@prisma/client";

// Create a Prisma client instance
export const prisma = Prisma({
  adapter: {
    type: "postgresql",
    url: process.env.DATABASE_URL, // your .env URL
  },
});