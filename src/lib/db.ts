import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

function getDbClient() {
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction && process.env.TURSO_DATABASE_URL) {
    // Production: Turso cloud SQLite
    return createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }

  // Local development: SQLite file
  const url = process.env.DATABASE_URL || "file:./kiyora-survey.db";
  return createClient({ url });
}

const client = getDbClient();

export const db = drizzle(client, { schema });
export { client };
