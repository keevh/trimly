import { Pool } from "pg";

const globalForPool = globalThis;
const connectionString =
  process.env.DATABASE_URL ?? "postgres://trimly:trimly@127.0.0.1:5433/trimly";

if (!globalForPool.__trimlyPool || globalForPool.__trimlyPoolConnectionString !== connectionString) {
  const previousPool = globalForPool.__trimlyPool;
  if (previousPool) {
    void previousPool.end().catch(() => {
      // Ignore shutdown errors during hot reloads.
    });
  }

  globalForPool.__trimlyPool = new Pool({
    max: 10,
    connectionString,
    ssl:
      process.env.PGSSL === "true"
        ? { rejectUnauthorized: false }
        : undefined,
  });
  globalForPool.__trimlyPoolConnectionString = connectionString;
}

export const pool = globalForPool.__trimlyPool;
