// import { PrismaClient } from "@prisma/client";
import Prisma from "@prisma/client";

// Create the Prisma client with your DB connection
export const prisma = new PrismaClient({
  // connection URL here
  // either 'adapter' or 'accelerateUrl' depending on your setup
  adapter: {
    type: "postgresql",
    url: process.env.DATABASE_URL, // must be in .env
  },
});