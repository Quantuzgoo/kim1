import { DatabaseSync } from "node:sqlite";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const dataDir = process.env.DATA_DIR || path.join(process.cwd(), "data");
const legacyUploadsDir = path.join(dataDir, "uploads");

let db = null;

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  const [salt, hash] = String(stored).split(":");
  if (!salt || !hash) {
    return false;
  }
  const candidate = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
}

export function getDb() {
  if (db) {
    return db;
  }

  fs.mkdirSync(dataDir, { recursive: true });
  db = new DatabaseSync(path.join(dataDir, "cars.db"));

  // WAL mode relies on shared-memory mmap/locking that fails with "disk I/O error"
  // on Windows Docker bind mounts. DELETE mode works reliably on mounted volumes.
  db.exec(`
    PRAGMA journal_mode = DELETE;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      address_line1 TEXT NOT NULL DEFAULT '',
      address_line2 TEXT NOT NULL DEFAULT '',
      county TEXT NOT NULL DEFAULT '',
      postcode TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      is_admin INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS login_links (
      token TEXT PRIMARY KEY,
      client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL,
      used_at TEXT
    );

    CREATE TABLE IF NOT EXISTS photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      filename TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      photo_data BLOB,
      description TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS quotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      damage_type TEXT NOT NULL,
      severity TEXT NOT NULL,
      panels INTEGER NOT NULL,
      registration TEXT NOT NULL DEFAULT '',
      postcode TEXT NOT NULL DEFAULT '',
      contact_methods TEXT NOT NULL DEFAULT '',
      other_details TEXT NOT NULL DEFAULT '',
      admin_note TEXT NOT NULL DEFAULT '',
      estimate_low INTEGER NOT NULL,
      estimate_high INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS quote_intakes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      registration TEXT NOT NULL,
      postcode TEXT NOT NULL,
      name TEXT NOT NULL DEFAULT '',
      address_line1 TEXT NOT NULL DEFAULT '',
      address_line2 TEXT NOT NULL DEFAULT '',
      county TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      other_details TEXT NOT NULL DEFAULT '',
      admin_note TEXT NOT NULL DEFAULT '',
      reference TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'new',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  ensureClientProfileColumns(db);
  ensureQuoteColumns(db);
  ensurePhotoDataColumn(db);
  ensureQuoteIntakeColumns(db);
  migrateLegacyPhotoFiles(db);
  seedAdmin(db);
  return db;
}

function ensureClientProfileColumns(database) {
  const columns = database.prepare("PRAGMA table_info(clients)").all();

  if (!columns.some((column) => column.name === "address_line1")) {
    database.exec("ALTER TABLE clients ADD COLUMN address_line1 TEXT NOT NULL DEFAULT ''");
  }
  if (!columns.some((column) => column.name === "address_line2")) {
    database.exec("ALTER TABLE clients ADD COLUMN address_line2 TEXT NOT NULL DEFAULT ''");
  }
  if (!columns.some((column) => column.name === "county")) {
    database.exec("ALTER TABLE clients ADD COLUMN county TEXT NOT NULL DEFAULT ''");
  }
  if (!columns.some((column) => column.name === "postcode")) {
    database.exec("ALTER TABLE clients ADD COLUMN postcode TEXT NOT NULL DEFAULT ''");
  }
  if (!columns.some((column) => column.name === "phone")) {
    database.exec("ALTER TABLE clients ADD COLUMN phone TEXT NOT NULL DEFAULT ''");
  }
}

function ensureQuoteColumns(database) {
  const columns = database.prepare("PRAGMA table_info(quotes)").all();

  if (!columns.some((column) => column.name === "registration")) {
    database.exec("ALTER TABLE quotes ADD COLUMN registration TEXT NOT NULL DEFAULT ''");
  }
  if (!columns.some((column) => column.name === "postcode")) {
    database.exec("ALTER TABLE quotes ADD COLUMN postcode TEXT NOT NULL DEFAULT ''");
  }
  if (!columns.some((column) => column.name === "contact_methods")) {
    database.exec("ALTER TABLE quotes ADD COLUMN contact_methods TEXT NOT NULL DEFAULT ''");
  }
  if (!columns.some((column) => column.name === "other_details")) {
    database.exec("ALTER TABLE quotes ADD COLUMN other_details TEXT NOT NULL DEFAULT ''");
  }
  if (!columns.some((column) => column.name === "admin_note")) {
    database.exec("ALTER TABLE quotes ADD COLUMN admin_note TEXT NOT NULL DEFAULT ''");
  }
}

function ensurePhotoDataColumn(database) {
  const columns = database.prepare("PRAGMA table_info(photos)").all();
  const hasPhotoData = columns.some((column) => column.name === "photo_data");

  if (!hasPhotoData) {
    database.exec("ALTER TABLE photos ADD COLUMN photo_data BLOB");
  }
}

function ensureQuoteIntakeColumns(database) {
  const columns = database.prepare("PRAGMA table_info(quote_intakes)").all();

  if (!columns.some((column) => column.name === "email")) {
    database.exec("ALTER TABLE quote_intakes ADD COLUMN email TEXT");
  }
  if (!columns.some((column) => column.name === "reference")) {
    database.exec("ALTER TABLE quote_intakes ADD COLUMN reference TEXT");
  }
  if (!columns.some((column) => column.name === "status")) {
    database.exec("ALTER TABLE quote_intakes ADD COLUMN status TEXT NOT NULL DEFAULT 'new'");
  }
  if (!columns.some((column) => column.name === "name")) {
    database.exec("ALTER TABLE quote_intakes ADD COLUMN name TEXT NOT NULL DEFAULT ''");
  }
  if (!columns.some((column) => column.name === "address_line1")) {
    database.exec("ALTER TABLE quote_intakes ADD COLUMN address_line1 TEXT NOT NULL DEFAULT ''");
  }
  if (!columns.some((column) => column.name === "address_line2")) {
    database.exec("ALTER TABLE quote_intakes ADD COLUMN address_line2 TEXT NOT NULL DEFAULT ''");
  }
  if (!columns.some((column) => column.name === "county")) {
    database.exec("ALTER TABLE quote_intakes ADD COLUMN county TEXT NOT NULL DEFAULT ''");
  }
  if (!columns.some((column) => column.name === "phone")) {
    database.exec("ALTER TABLE quote_intakes ADD COLUMN phone TEXT NOT NULL DEFAULT ''");
  }
  if (!columns.some((column) => column.name === "other_details")) {
    database.exec("ALTER TABLE quote_intakes ADD COLUMN other_details TEXT NOT NULL DEFAULT ''");
  }
  if (!columns.some((column) => column.name === "admin_note")) {
    database.exec("ALTER TABLE quote_intakes ADD COLUMN admin_note TEXT NOT NULL DEFAULT ''");
  }

  database
    .prepare("UPDATE quote_intakes SET email = 'unknown@unknown.local' WHERE email IS NULL OR email = ''")
    .run();

  database
    .prepare("UPDATE quote_intakes SET reference = 'Q-' || id WHERE reference IS NULL OR reference = ''")
    .run();

  database.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_quote_intakes_reference ON quote_intakes(reference)");
}

function migrateLegacyPhotoFiles(database) {
  if (!fs.existsSync(legacyUploadsDir)) {
    return;
  }

  const photos = database
    .prepare("SELECT id, filename FROM photos WHERE photo_data IS NULL")
    .all();

  for (const photo of photos) {
    const filePath = path.join(legacyUploadsDir, path.basename(photo.filename));

    if (!fs.existsSync(filePath)) {
      continue;
    }

    const buffer = fs.readFileSync(filePath);
    database.prepare("UPDATE photos SET photo_data = ? WHERE id = ?").run(buffer, photo.id);
    fs.unlinkSync(filePath);
  }
}

function seedAdmin(database) {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@novabodyworks.com";
  const existing = database
    .prepare("SELECT id FROM clients WHERE email = ?")
    .get(adminEmail);

  if (!existing) {
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
    database
      .prepare(
        "INSERT INTO clients (name, email, password_hash, is_admin) VALUES (?, ?, ?, 1)",
      )
      .run("Nova Admin", adminEmail, hashPassword(adminPassword));
  }
}
