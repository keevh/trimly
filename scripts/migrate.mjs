import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "../src/lib/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const schemaPath = path.join(__dirname, "..", "db", "schema.sql");

async function waitForDatabase(retries = 30) {
  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      await pool.query("SELECT 1");
      return;
    } catch (error) {
      if (attempt === retries - 1) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

async function main() {
  await waitForDatabase();
  const schema = await fs.readFile(schemaPath, "utf8");
  await pool.query(schema);
  await pool.end();
}

main().catch(async (error) => {
  console.error(error);
  try {
    await pool.end();
  } catch {
    // ignore shutdown errors
  }
  process.exit(1);
});

