// drizzle.config.js

import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

dotenv.config();

/** @type { import("drizzle-kit").Config } */
export default defineConfig({
  schema: "./src/db/schema",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
    ssl: true,
  },
});
