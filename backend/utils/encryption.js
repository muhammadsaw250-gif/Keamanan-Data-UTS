
const crypto = require("crypto");

function deriveKeys(privateKey, salt) {
  const derived = crypto.pbkdf2Sync(
    privateKey,
    salt,
    310000,
    64,
    "sha256"
  );

  return {
    encryptionKey: derived.subarray(0, 32),
    authKey: derived.subarray(32, 64)
  };
}

function createVerifier(authKey) {
  return crypto
    .createHmac("sha256", authKey)
    .update("secure-library-admin")
    .digest("hex");
}

function encryptContent(content, encryptionKey) {
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv(
    "aes-256-gcm",
    encryptionKey,
    iv
  );

  let encrypted = cipher.update(
    JSON.stringify(content),
    "utf8",
    "hex"
  );

  encrypted += cipher.final("hex");

  return {
    ciphertext: encrypted,
    iv: iv.toString("hex"),
    auth_tag: cipher.getAuthTag().toString("hex")
  };
}

function decryptContent(data, encryptionKey) {
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    encryptionKey,
    Buffer.from(data.iv, "hex")
  );

  decipher.setAuthTag(
    Buffer.from(data.auth_tag, "hex")
  );

  let decrypted = decipher.update(
    data.ciphertext,
    "hex",
    "utf8"
  );

  decrypted += decipher.final("utf8");

  return JSON.parse(decrypted);
}

module.exports = {
  deriveKeys,
  createVerifier,
  encryptContent,
  decryptContent
};
