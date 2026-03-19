// server/prismaClient.ts
import 'dotenv/config';       // make sure env variables are loaded
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient(); // no datasources here

export default prisma;