import pkg from "pg"; // Use default import for pg (CommonJS)
const { Client } = pkg; // Destructure Client from the default import
import { drizzle } from "drizzle-orm/node-postgres";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined in environment variables");
}

// Create PostgreSQL client
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

// Connect to PostgreSQL
client
  .connect()
  .then(() => console.log("Connected to PostgreSQL"))
  .catch((err) => console.error("Connection error", err.stack));

// Pass the client to drizzle-orm
const sql = client;

// Create database connection with drizzle-orm
export const db = drizzle(sql);

// // src/db/index.js
// import { drizzle } from "drizzle-orm/neon-http";
// import { neon } from "@neondatabase/serverless";
// import dotenv from "dotenv";

// // Load environment variables
// dotenv.config();

// if (!process.env.DATABASE_URL) {
//   throw new Error("DATABASE_URL is not defined in environment variables");
// }

// // Create database connection
// const sql = neon(process.env.DATABASE_URL);
// export const db = drizzle(sql);
