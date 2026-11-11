
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  BookOpen,
  Plus,
  LogOut,
  LockKeyhole,
  RefreshCw,
  Image,
  Trash2,
  Upload,
  X
} from "lucide-react";

const API_URL = "http://localhost:5000/api";
const SERVER_URL = "http://localhost:5000";

const initialForm = {
  title: "",
  author: "",
  category: "Technology",
  year: new Date().getFullYear(),
  cover: "",
  content: ""
};

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [form, setForm] = useState(initialForm);
  const [coverPreview, setCoverPreview] = useState("");

  const token = sessionStorage.getItem("adminToken");

  // ======================================
  // MEMUAT DATA BUKU
  // ======================================

  async function loadBooks() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/books`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.status === 401) {
        sessionStorage.removeItem("adminToken");
        navigate("/admin");
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Gagal mengambil buku.");
      }

      setBooks(data);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token) {
      navigate("/admin");
      return;
    }

    loadBooks();
  }, []);

  // ======================================
  // INPUT FORM
  // ======================================

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value
    }));
  }

  // ======================================
  // UPLOAD COVER
  // ======================================

  async function handleCoverUpload(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    setMessage("");
    setError("");

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Cover harus berformat JPG, PNG, atau WEBP.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran cover maksimal 5 MB.");
      e.target.value = "";
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setCoverPreview(previewUrl);

    const formData = new FormData();
    formData.append("cover", file);

    try {
      setUploading(true);

      const response = await fetch(`${API_URL}/upload-cover`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.status === 401) {
        sessionStorage.removeItem("adminToken");
        navigate("/admin");
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Upload cover gagal.");
      }

      setForm((previous) => ({
        ...previous,
        cover: data.cover
      }));

      setMessage("Cover berhasil diupload.");

    } catch (err) {
      setError(err.message);
      setCoverPreview("");
      setForm((previous) => ({
        ...previous,
        cover: ""
      }));
    } finally {
      setUploading(false);
    }
  }

  // ======================================
  // HAPUS PREVIEW COVER
  // ======================================

  function removeCoverPreview() {
    setCoverPreview("");

    setForm((previous) => ({
      ...previous,
      cover: ""
    }));

    const fileInput = document.getElementById("cover-upload");

    if (fileInput) {
      fileInput.value = "";
    }
  }

  // ======================================
  // TAMBAH BUKU
  // ======================================

  async function handleAddBook(e) {
    e.preventDefault();

    setMessage("");
    setError("");

    if (uploading) {
      setError("Tunggu sampai upload cover selesai.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`${API_URL}/books`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...form,
          year: Number(form.year)
        })
      });

      const data = await response.json();

      if (response.status === 401) {
        sessionStorage.removeItem("adminToken");
        navigate("/admin");
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Gagal menyimpan buku.");
      }

      setMessage("Buku berhasil dienkripsi dan disimpan.");

      setForm(initialForm);
      setCoverPreview("");

      const fileInput = document.getElementById("cover-upload");

      if (fileInput) {
        fileInput.value = "";
      }

      await loadBooks();

    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // ======================================
  // HAPUS BUKU
  // ======================================

  async function handleDeleteBook(id, title) {
    const confirmed = window.confirm(
      `Apakah kamu yakin ingin menghapus buku "${title}"?`
    );

    if (!confirmed) return;

    setMessage("");
    setError("");
    setDeletingId(id);

    try {
      const response = await fetch(`${API_URL}/books/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.status === 401) {
        sessionStorage.removeItem("adminToken");
        navigate("/admin");
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Gagal menghapus buku.");
      }

      setMessage("Buku berhasil dihapus.");

      setBooks((previous) =>
        previous.filter((book) => book.id !== id)
      );

    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  // ======================================
  // LOGOUT ADMIN
  // ======================================

  async function handleLogout() {
    try {
      await fetch(`${API_URL}/admin/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    } catch (err) {
      console.error("Logout request gagal:", err);
    }

    sessionStorage.removeItem("adminToken");
    navigate("/admin");
  }

  // ======================================
  // TAMPILAN
  // ======================================

  return (
    <div className="dashboard-page">

      <header className="dashboard-navbar">
        <div className="dashboard-brand">
          <ShieldCheck size={27} />
          SECURE <span>LIBRARY</span>
        </div>

        <button
          className="dashboard-logout"
          onClick={handleLogout}
        >
          <LogOut size={17} />
          Logout
        </button>
      </header>

      <main className="dashboard-container">

        <div className="dashboard-heading">
          <div>
            <span className="section-label">
              SECURE ADMIN PANEL
            </span>

            <h1>
              Admin <span>Dashboard</span>
            </h1>

            <p>
              Kelola koleksi buku dengan sistem enkripsi
              AES-256-GCM.
            </p>
          </div>

          <div className="dashboard-status">
            <LockKeyhole size={17} />
            Encrypted Session
          </div>
        </div>

        {/* STATISTIK */}

        <div className="dashboard-stats">

          <div className="dashboard-stat-card">
            <BookOpen size={25} />

            <div>
              <h2>{books.length}</h2>
              <p>Total Buku</p>
            </div>
          </div>

          <div className="dashboard-stat-card">
            <ShieldCheck size={25} />

            <div>
              <h2>AES-256</h2>
              <p>Metode Enkripsi</p>
            </div>
          </div>

        </div>

        {/* FORM TAMBAH BUKU */}

        <section className="dashboard-panel">

          <div className="panel-heading">
            <div>
              <h2>
                <Plus size={20} />
                Tambah Buku Baru
              </h2>

              <p>
                Konten buku dienkripsi sebelum disimpan ke database.
              </p>
            </div>
          </div>

          <form onSubmit={handleAddBook}>

            <div className="dashboard-form-grid">

              <div>
                <label>Judul Buku</label>

                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Masukkan judul buku"
                  required
                />
              </div>

              <div>
                <label>Penulis</label>

                <input
                  name="author"
                  value={form.author}
                  onChange={handleChange}
                  placeholder="Nama penulis"
                  required
                />
              </div>

              <div>
                <label>Kategori</label>

                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                >
                  <option value="Technology">Technology</option>
                  <option value="Business">Business</option>
                  <option value="Productivity">Productivity</option>
                </select>
              </div>

              <div>
                <label>Tahun Terbit</label>

                <input
                  type="number"
                  name="year"
                  value={form.year}
                  onChange={handleChange}
                  min="1000"
                  max="2100"
                  required
                />
              </div>

              {/* UPLOAD COVER */}

              <div className="form-full">

                <label>
                  <Image
                    size={15}
                    style={{ verticalAlign: "middle" }}
                  />
                  {" "}Upload Cover Buku
                </label>

                <input
                  id="cover-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleCoverUpload}
                  disabled={uploading || saving}
                />

                <p style={{
                  fontSize: "12px",
                  marginTop: "7px",
                  opacity: 0.7
                }}>
                  Format JPG, PNG, WEBP. Maksimal 5 MB.
                </p>

                {uploading && (
                  <p className="dashboard-empty">
                    Mengupload cover...
                  </p>
                )}

                {coverPreview && (
                  <div style={{
                    marginTop: "15px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "15px"
                  }}>
                    <img
                      src={coverPreview}
                      alt="Preview cover buku"
                      style={{
                        width: "120px",
                        height: "155px",
                        objectFit: "cover",
                        borderRadius: "8px"
                      }}
                    />

                    <button
                      type="button"
                      onClick={removeCoverPreview}
                      disabled={uploading || saving}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "9px 12px",
                        cursor: "pointer"
                      }}
                    >
                      <X size={16} />
                      Hapus Cover
                    </button>
                  </div>
                )}

              </div>

              {/* ISI BUKU */}

              <div className="form-full">
                <label>Isi Konten Buku</label>

                <textarea
                  name="content"
                  value={form.content}
                  onChange={handleChange}
                  placeholder="Masukkan isi atau deskripsi buku..."
                  rows="5"
                  required
                />
              </div>

            </div>

            <button
              className="dashboard-add-button"
              type="submit"
              disabled={saving || uploading}
            >
              <LockKeyhole size={17} />

              {saving
                ? "Menyimpan..."
                : uploading
                  ? "Mengupload Cover..."
                  : "Enkripsi & Simpan Buku"}
            </button>

          </form>

          {message && (
            <p className="dashboard-success">
              {message}
            </p>
          )}

          {error && (
            <p className="dashboard-error">
              {error}
            </p>
          )}

        </section>

        {/* KOLEKSI BUKU */}

        <section className="dashboard-panel">

          <div className="panel-heading">
            <div>
              <h2>
                <BookOpen size={20} />
                Koleksi Buku Terenkripsi
              </h2>

              <p>
                Konten ditampilkan setelah berhasil didekripsi.
              </p>
            </div>

            <button
              className="refresh-button"
              onClick={loadBooks}
              disabled={loading}
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="dashboard-empty">
              Memuat data buku...
            </p>
          ) : books.length === 0 ? (
            <p className="dashboard-empty">
              Belum ada buku di database.
            </p>
          ) : (
            <div className="admin-book-list">

              {books.map((book) => (

                <article
                  className="admin-book-card"
                  key={book.id}
                >

                  {/* COVER BUKU */}

                  {book.cover ? (
                    <img
                      src={
                        book.cover.startsWith("http")
                          ? book.cover
                          : `${SERVER_URL}${book.cover}`
                      }
                      alt={book.title}
                      style={{
                        width: "85px",
                        height: "115px",
                        objectFit: "cover",
                        borderRadius: "8px",
                        flexShrink: 0
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="admin-book-icon">
                      <BookOpen size={24} />
                    </div>
                  )}

                  {/* INFORMASI BUKU */}

                  <div className="admin-book-info">

                    <span>{book.category}</span>

                    <h3>{book.title}</h3>

                    <p>Penulis: {book.author}</p>

                    {book.year && (
                      <p>Tahun: {book.year}</p>
                    )}

                    <p className="admin-book-content">
                      {book.content}
                    </p>

                  </div>

                  <ShieldCheck
                    className="admin-book-secure"
                    size={20}
                  />

                  {/* TOMBOL HAPUS */}

                  <button
                    type="button"
                    onClick={() =>
                      handleDeleteBook(book.id, book.title)
                    }
                    disabled={deletingId === book.id}
                    title="Hapus buku"
                    style={{
                      background: "#dc2626",
                      color: "white",
                      border: "none",
                      borderRadius: "7px",
                      padding: "9px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      flexShrink: 0
                    }}
                  >
                    <Trash2 size={17} />

                    {deletingId === book.id
                      ? "Menghapus..."
                      : "Hapus"}
                  </button>

                </article>

              ))}

            </div>
          )}

        </section>

      </main>
    </div>
  );
}
