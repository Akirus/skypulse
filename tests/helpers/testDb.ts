import { mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

export function createTestDb(name: string): string {
  const dir = mkdtempSync(path.join(os.tmpdir(), `skypulse-${name}-`));
  const dbPath = path.join(dir, "test.sqlite");
  const db = new DatabaseSync(dbPath);

  db.exec(`
    CREATE TABLE user_preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      location_id TEXT NOT NULL,
      preference_type TEXT NOT NULL,
      preference_value TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.close();
  return dbPath;
}

export function insertPreferences(
  dbPath: string,
  rows: Array<{
    user_id: string;
    location_id: string;
    preference_type: string;
    preference_value: string;
  }>
): void {
  const db = new DatabaseSync(dbPath);
  const statement = db.prepare(
    `
      INSERT INTO user_preferences (
        user_id,
        location_id,
        preference_type,
        preference_value
      ) VALUES (?, ?, ?, ?)
    `
  );

  for (const row of rows) {
    statement.run(
      row.user_id,
      row.location_id,
      row.preference_type,
      row.preference_value
    );
  }

  db.close();
}
