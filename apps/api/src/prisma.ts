// const { PrismaClient } = require("@prisma/client");
// const { PrismaPg } = require("@prisma/adapter-pg");

// require("dotenv").config();



// const adapter = new PrismaPg({
//      connectionString: process.env.DATABASE_URL,
// });

// const prisma = new PrismaClient({
//     adapter
// });

// module.exports = prisma;

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });
export default prisma;