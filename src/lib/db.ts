import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";
import fs from "fs";
import path from "path";

function getDbClient() {
  const tursoUrl =
    process.env.TURSO_DATABASE_URL ||
    (process.env.DATABASE_URL?.startsWith("libsql://") ||
    process.env.DATABASE_URL?.startsWith("https://")
      ? process.env.DATABASE_URL
      : undefined);
  const authToken =
    process.env.TURSO_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN;

  if (tursoUrl) {
    // Production / Remote: Turso cloud SQLite
    return createClient({
      url: tursoUrl,
      authToken: authToken,
    });
  }

  // Vercel Serverless fallback: writable /tmp directory
  if (process.env.VERCEL) {
    const tmpDbPath = "/tmp/kiyora-survey.db";
    const localDbPath = path.join(process.cwd(), "kiyora-survey.db");
    if (!fs.existsSync(tmpDbPath) && fs.existsSync(localDbPath)) {
      try {
        fs.copyFileSync(localDbPath, tmpDbPath);
      } catch (e) {
        console.warn("Could not copy seed DB to /tmp:", e);
      }
    }
    return createClient({ url: `file:${tmpDbPath}` });
  }

  // Local development: SQLite file
  const url = process.env.DATABASE_URL || "file:./kiyora-survey.db";
  return createClient({ url });
}

const client = getDbClient();

export const db = drizzle(client, { schema });
export { client };
