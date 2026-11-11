
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
require("dotenv").config();

const db = require("./database/db");

const {
  deriveKeys,
  createVerifier,
  encryptContent,
  decryptContent
} = require("./utils/encryption");

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 5000;

// ======================================
// KONFIGURASI UPLOAD COVER
// ======================================

const UPLOAD_DIR = path.join(__dirname, "uploads");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

app.use("/uploads", express.static(UPLOAD_DIR));

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, UPLOAD_DIR);
  },

  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const filename = `${crypto.randomUUID()}${extension}`;

    callback(null, filename);
  }
});

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024
  },

  fileFilter: (req, file, callback) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return callback(
        new Error("Format cover harus JPG, PNG, atau WEBP.")
      );
    }

    callback(null, true);
  }
});

// ======================================
// SESI DAN KEAMANAN LOGIN
// ======================================

const SESSION_DURATION = 30 * 60 * 1000;
const sessions = new Map();

const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW = 15 * 60 * 1000;

// ======================================
// STATUS ADMIN
// ======================================

app.get("/api/status", (req, res) => {
  const admin = db
    .prepare("SELECT id FROM admin_settings WHERE id = 1")
    .get();

  res.json({
    configured: Boolean(admin)
  });
});

// ======================================
// SETUP PRIVATE KEY ADMIN
// ======================================

app.post("/api/admin/setup", (req, res) => {
  const { privateKey } = req.body;

  if (
    typeof privateKey !== "string" ||
    privateKey.length < 12
  ) {
    return res.status(400).json({
      message: "Private key minimal 12 karakter."
    });
  }

  const existing = db
    .prepare("SELECT id FROM admin_settings WHERE id = 1")
    .get();

  if (existing) {
    return res.status(409).json({
      message: "Admin sudah dikonfigurasi."
    });
  }

  const salt = crypto.randomBytes(16);
  const keys = deriveKeys(privateKey, salt);
  const verifier = createVerifier(keys.authKey);

  db.prepare(`
    INSERT INTO admin_settings (id, salt, verifier)
    VALUES (1, ?, ?)
  `).run(salt.toString("hex"), verifier);

  res.json({
    message: "Private key berhasil dibuat."
  });
});

// ======================================
// LOGIN ADMIN
// ======================================

app.post("/api/admin/unlock", (req, res) => {
  const { privateKey } = req.body;
  const ip = req.ip;
  const now = Date.now();

  let attempt = loginAttempts.get(ip);

  if (attempt && now - attempt.startedAt >= LOGIN_WINDOW) {
    loginAttempts.delete(ip);
    attempt = null;
  }

  if (attempt && attempt.count >= MAX_LOGIN_ATTEMPTS) {
    return res.status(429).json({
      message: "Terlalu banyak percobaan. Coba lagi dalam 15 menit."
    });
  }

  if (
    typeof privateKey !== "string" ||
    !privateKey
  ) {
    return res.status(400).json({
      message: "Private key wajib diisi."
    });
  }

  const admin = db
    .prepare("SELECT * FROM admin_settings WHERE id = 1")
    .get();

  if (!admin) {
    return res.status(400).json({
      message: "Admin belum dikonfigurasi."
    });
  }

  const salt = Buffer.from(admin.salt, "hex");
  const keys = deriveKeys(privateKey, salt);
  const verifier = createVerifier(keys.authKey);

  const storedVerifier = Buffer.from(admin.verifier, "hex");
  const inputVerifier = Buffer.from(verifier, "hex");

  const valid =
    storedVerifier.length === inputVerifier.length &&
    crypto.timingSafeEqual(storedVerifier, inputVerifier);

  if (!valid) {
    if (!attempt) {
      loginAttempts.set(ip, {
        count: 1,
        startedAt: now
      });
    } else {
      attempt.count += 1;
    }

    return res.status(401).json({
      message: "Private key salah."
    });
  }

  loginAttempts.delete(ip);

  const token = crypto.randomBytes(32).toString("hex");

  sessions.set(token, {
    encryptionKey: keys.encryptionKey,
    expiresAt: now + SESSION_DURATION
  });

  res.json({
    message: "Berhasil membuka dashboard.",
    token
  });
});

// ======================================
// AUTENTIKASI ADMIN
// ======================================

function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace(
    "Bearer ",
    ""
  );

  if (!token || !sessions.has(token)) {
    return res.status(401).json({
      message: "Akses ditolak. Silakan login kembali."
    });
  }

  const session = sessions.get(token);

  if (!session || Date.now() >= session.expiresAt) {
    sessions.delete(token);

    return res.status(401).json({
      message: "Sesi admin berakhir. Silakan login kembali."
    });
  }

  req.encryptionKey = session.encryptionKey;
  next();
}

// ======================================
// UPLOAD COVER BUKU
// ======================================

app.post(
  "/api/upload-cover",
  authenticate,
  (req, res, next) => {
    upload.single("cover")(req, res, (error) => {
      if (error) {
        return res.status(400).json({
          message: error.message
        });
      }

      next();
    });
  },
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        message: "Pilih gambar cover terlebih dahulu."
      });
    }

    res.status(201).json({
      message: "Cover berhasil diupload.",
      cover: `/uploads/${req.file.filename}`
    });
  }
);

// ======================================
// LANDING PAGE
// MENGAMBIL KATALOG BUKU
// ======================================

app.get("/api/public/books", (req, res) => {
  try {
    const books = db.prepare(`
      SELECT
        book_id AS id,
        title,
        author,
        category,
        year,
        cover,
        created_at
      FROM public_catalog
      ORDER BY book_id DESC
    `).all();

    res.json(books);

  } catch (error) {
    console.error("Gagal mengambil buku publik:", error);

    res.status(500).json({
      message: "Gagal mengambil koleksi buku."
    });
  }
});

// ======================================
// TAMBAH BUKU
// ENKRIPSI SEBELUM DISIMPAN
// ======================================

app.post("/api/books", authenticate, (req, res) => {
  const {
    title,
    author,
    category,
    year,
    cover,
    content
  } = req.body;

  if (
    typeof title !== "string" || !title.trim() ||
    typeof author !== "string" || !author.trim() ||
    typeof category !== "string" || !category.trim() ||
    typeof content !== "string" || !content.trim()
  ) {
    return res.status(400).json({
      message: "Judul, penulis, kategori, dan konten wajib diisi."
    });
  }

  const bookYear =
    Number.isInteger(year) && year >= 1000 && year <= 2100
      ? year
      : null;

  const bookCover =
    typeof cover === "string" && cover.trim()
      ? cover.trim()
      : null;

  try {
    const bookData = {
      title: title.trim(),
      author: author.trim(),
      category: category.trim(),
      year: bookYear,
      cover: bookCover,
      content: content.trim()
    };

    const encrypted = encryptContent(
      bookData,
      req.encryptionKey
    );

    db.exec("BEGIN");

    let result;

    try {
      result = db.prepare(`
        INSERT INTO books (
          ciphertext,
          iv,
          auth_tag
        )
        VALUES (?, ?, ?)
      `).run(
        encrypted.ciphertext,
        encrypted.iv,
        encrypted.auth_tag
      );

      db.prepare(`
        INSERT INTO public_catalog (
          book_id,
          title,
          author,
          category,
          year,
          cover
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        Number(result.lastInsertRowid),
        bookData.title,
        bookData.author,
        bookData.category,
        bookData.year,
        bookData.cover
      );

      db.exec("COMMIT");

    } catch (databaseError) {
      db.exec("ROLLBACK");
      throw databaseError;
    }

    res.status(201).json({
      message: "Buku berhasil dienkripsi dan disimpan.",
      id: Number(result.lastInsertRowid)
    });

  } catch (error) {
    console.error("Gagal menyimpan buku:", error);

    res.status(500).json({
      message: "Gagal menyimpan buku."
    });
  }
});

// ======================================
// ADMIN
// DEKRIPSI SEMUA BUKU
// ======================================

app.get("/api/books", authenticate, (req, res) => {
  try {
    const records = db.prepare(`
      SELECT *
      FROM books
      ORDER BY id DESC
    `).all();

    const books = records.map((record) => {
      const decrypted = decryptContent(
        record,
        req.encryptionKey
      );

      return {
        id: record.id,
        ...decrypted
      };
    });

    res.json(books);

  } catch (error) {
    console.error("Dekripsi gagal:", error);

    res.status(500).json({
      message: "Dekripsi konten gagal."
    });
  }
});

// ======================================
// HAPUS BUKU
// ======================================

app.delete("/api/books/:id", authenticate, (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      message: "ID buku tidak valid."
    });
  }

  try {
    const book = db.prepare(`
      SELECT book_id, cover
      FROM public_catalog
      WHERE book_id = ?
    `).get(id);

    const existingBook = db.prepare(`
      SELECT id
      FROM books
      WHERE id = ?
    `).get(id);

    if (!existingBook) {
      return res.status(404).json({
        message: "Buku tidak ditemukan."
      });
    }

    db.prepare(`
      DELETE FROM books
      WHERE id = ?
    `).run(id);

    // public_catalog ikut terhapus melalui ON DELETE CASCADE.

    // Hapus file cover lokal jika ada.
    if (
      book &&
      typeof book.cover === "string" &&
      book.cover.startsWith("/uploads/")
    ) {
      const filename = path.basename(book.cover);
      const coverPath = path.join(UPLOAD_DIR, filename);

      if (
        path.dirname(coverPath) === UPLOAD_DIR &&
        fs.existsSync(coverPath)
      ) {
        fs.unlinkSync(coverPath);
      }
    }

    res.json({
      message: "Buku berhasil dihapus."
    });

  } catch (error) {
    console.error("Gagal menghapus buku:", error);

    res.status(500).json({
      message: "Gagal menghapus buku."
    });
  }
});

// ======================================
// LOGOUT ADMIN
// ======================================

app.post("/api/admin/logout", authenticate, (req, res) => {
  const token = req.headers.authorization.replace(
    "Bearer ",
    ""
  );

  sessions.delete(token);

  res.json({
    message: "Berhasil logout."
  });
});

// ======================================
// ERROR HANDLER
// ======================================

app.use((error, req, res, next) => {
  console.error(error);

  res.status(500).json({
    message: "Terjadi kesalahan pada server."
  });
});

// ======================================
// MENJALANKAN SERVER
// ======================================

app.listen(PORT, () => {
  console.log(
    `Backend berjalan di http://localhost:${PORT}`
  );
});
