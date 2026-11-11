
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  LockKeyhole,
  Eye,
  EyeOff,
  ArrowLeft,
  KeyRound
} from "lucide-react";

const API_URL = "http://localhost:5000/api";

export default function AdminLogin() {
  const [privateKey, setPrivateKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    if (!privateKey.trim()) {
      setError("Private key wajib diisi.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/admin/unlock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ privateKey })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login gagal.");
      }

      sessionStorage.setItem("adminToken", data.token);

      navigate("/admin/dashboard");
    } catch (err) {
      setError(err.message || "Tidak dapat terhubung ke backend.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login-page">
      <button
        className="back-button"
        onClick={() => navigate("/")}
      >
        <ArrowLeft size={18} />
        Kembali ke Beranda
      </button>

      <div className="login-card">
        <div className="login-icon">
          <ShieldCheck size={34} />
        </div>

        <span className="login-label">
          SECURE ADMIN ACCESS
        </span>

        <h1>
          Admin <span>Authentication</span>
        </h1>

        <p>
          Masukkan private key untuk mengakses dan
          mendekripsi konten perpustakaan.
        </p>

        <form onSubmit={handleSubmit}>
          <label>PRIVATE KEY</label>

          <div className="private-key-input">
            <KeyRound size={19} />

            <input
              type={showKey ? "text" : "password"}
              placeholder="Masukkan private key..."
              value={privateKey}
              onChange={(e) => {
                setPrivateKey(e.target.value);
                setError("");
              }}
            />

            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="login-submit"
            disabled={loading}
          >
            <LockKeyhole size={18} />
            {loading ? "Memverifikasi..." : "Unlock Secure Dashboard"}
          </button>
        </form>

        <div className="login-security">
          <ShieldCheck size={17} />
          <span>Protected Access · AES-256-GCM</span>
        </div>
      </div>

      <div className="login-footer">
        SECURE DIGITAL LIBRARY © 2026
      </div>
    </div>
  );
}
