import { DatabaseSync } from "node:sqlite";
import { getConfig } from "./config";

type SqlInputValue = string | number | bigint | Uint8Array | null;
let initializedDbPath: string | null = null;

function getDb(): DatabaseSync {
  return new DatabaseSync(getConfig().dbPath);
}

export function initializeDatabase(): void {
  const dbPath = getConfig().dbPath;
  if (initializedDbPath === dbPath) {
    return;
  }

  const db = new DatabaseSync(dbPath);

  try {
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_user_preferences_location_id
      ON user_preferences(location_id)
    `);

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_user_preferences_user_location
      ON user_preferences(user_id, location_id)
    `);

    initializedDbPath = dbPath;
  } finally {
    db.close();
  }
}

export function isDatabaseReady(): boolean {
  const db = getDb();

  try {
    db.prepare("SELECT 1").get();
    return true;
  } catch {
    return false;
  } finally {
    db.close();
  }
}

export function runQuery<T>(sql: string, params: SqlInputValue[] = []): Promise<T[]> {
  initializeDatabase();
  const db = getDb();

  try {
    const statement = db.prepare(sql);
    const rows = statement.all(...params) as T[];
    return Promise.resolve(rows);
  } finally {
    db.close();
  }
}
