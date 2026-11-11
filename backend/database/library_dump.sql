BEGIN TRANSACTION;
CREATE TABLE admin_settings (
    id INTEGER PRIMARY KEY,
    salt TEXT NOT NULL,
    verifier TEXT NOT NULL
  );
INSERT INTO "admin_settings" ("id", "salt", "verifier") VALUES (1, 'e77e2e4cf1cd0496d53d767c48ddac3d', '64c32cfe44a508dfb759d3228de679b1d2a1cf7a4032541e947c8693fe82a9fd');
CREATE TABLE books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ciphertext TEXT NOT NULL,
    iv TEXT NOT NULL,
    auth_tag TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  , title TEXT, author TEXT, category TEXT, year INTEGER, cover TEXT);
INSERT INTO "books" ("id", "ciphertext", "iv", "auth_tag", "created_at", "title", "author", "category", "year", "cover") VALUES (1, 'ed0470b515503c5cf208e2144d3420c6e94052f627d9a4c6d4f7dcd68259cba82706f1bd163e45713a04c860aae430444eb2d9b507fc4dd6fd37839bd0b0ae9e376d55d7d14e5836695cf2fb49db5224360bfb8e3dab1c9e5b4e3e7b3778dc68747b25ec080e65317dc6ca271b3d62f4760e391c73d95545', '101a81df7acd60ba36e784e3', '591c9f27f481874df1d049f1dfb19ba0', '2026-11-08 05:02:30', NULL, NULL, NULL, NULL, NULL);
INSERT INTO "books" ("id", "ciphertext", "iv", "auth_tag", "created_at", "title", "author", "category", "year", "cover") VALUES (2, '05a72c04272b947a3b401f2e41c14837c3c995232f5b2f3eabe381d991618cd69bcaff8f94f8e13e4b4ea22a50acad9aa4e8857627e940440c67c4b72b84e301f6abfe254140a356545c127291c0169a34f7217b90edbff5f5ea57485ac6b67f8a0688b0a63a93b8eacd1ec84ea53a967f2a2114023d6714580cc3', 'ecbb7bea1d6a3422dde95883', 'da7575e9d9332f0f7e8fca429eea3eab', '2026-11-10 02:08:19', NULL, NULL, NULL, NULL, NULL);
CREATE TABLE public_catalog (
    book_id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    category TEXT NOT NULL,
    year INTEGER,
    cover TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
  );
INSERT INTO "public_catalog" ("book_id", "title", "author", "category", "year", "cover", "created_at") VALUES (1, 'Kisah 25 Nabi Dan Rasul', 'Harun Musa F.S.Kom', 'Productivity', NULL, NULL, '2026-11-08 05:02:30');
INSERT INTO "public_catalog" ("book_id", "title", "author", "category", "year", "cover", "created_at") VALUES (2, 'Kisah Cinta', 'Nayla', 'Productivity', NULL, NULL, '2026-11-10 02:08:19');
COMMIT;
