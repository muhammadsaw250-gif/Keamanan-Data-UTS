
const { DatabaseSync } = require("node:sqlite");
const path = require("path");

const db = new DatabaseSync(
  path.join(__dirname, "library.db")
);

// Konfigurasi SQLite
db.exec("PRAGMA foreign_keys = ON;");
db.exec("PRAGMA journal_mode = WAL;");

// ======================================
// MEMBUAT TABEL DATABASE
// ======================================

db.exec(`
  CREATE TABLE IF NOT EXISTS admin_settings (
    id INTEGER PRIMARY KEY,
    salt TEXT NOT NULL,
    verifier TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    author TEXT,
    category TEXT,
    year INTEGER,
    cover TEXT,
    ciphertext TEXT NOT NULL,
    iv TEXT NOT NULL,
    auth_tag TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS public_catalog (
    book_id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    category TEXT NOT NULL,
    year INTEGER,
    cover TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id)
      REFERENCES books(id)
      ON DELETE CASCADE
  );
`);

// ======================================
// MIGRASI KOLOM DATABASE LAMA
// ======================================

const columns = db
  .prepare("PRAGMA table_info(books)")
  .all();

const names = columns.map((column) => column.name);

const requiredColumns = [
  ["title", "TEXT"],
  ["author", "TEXT"],
  ["category", "TEXT"],
  ["year", "INTEGER"],
  ["cover", "TEXT"]
];

for (const [name, type] of requiredColumns) {
  if (!names.includes(name)) {
    db.exec(
      `ALTER TABLE books ADD COLUMN ${name} ${type}`
    );
  }
}

// ======================================
// MIGRASI KATALOG BUKU LAMA
// ======================================

db.exec("BEGIN");

try {
  db.exec(`
    INSERT OR IGNORE INTO public_catalog (
      book_id,
      title,
      author,
      category,
      year,
      cover,
      created_at
    )
    SELECT
      id,
      COALESCE(NULLIF(title, ''), 'Buku lama'),
      COALESCE(NULLIF(author, ''), 'Tidak diketahui'),
      COALESCE(NULLIF(category, ''), 'Umum'),
      year,
      cover,
      COALESCE(created_at, CURRENT_TIMESTAMP)
    FROM books
    WHERE
      title IS NOT NULL
      OR author IS NOT NULL
      OR category IS NOT NULL
  `);

  // Kosongkan metadata lama dari tabel books.
  // Metadata lengkap tetap tersedia dalam ciphertext.
  db.exec(`
    UPDATE books
    SET
      title = NULL,
      author = NULL,
      category = NULL,
      year = NULL,
      cover = NULL
  `);

  db.exec("COMMIT");

} catch (error) {
  db.exec("ROLLBACK");
  throw error;
}

// ======================================
// EXPORT DATABASE
// ======================================

module.exports = db;
