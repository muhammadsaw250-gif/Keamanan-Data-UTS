
import { useEffect, useState } from "react";
import { Search, BookOpen } from "lucide-react";

import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import BookCard from "../components/BookCard";
import Footer from "../components/Footer";

const API_URL = "http://localhost:5000/api";
const SERVER_URL = "http://localhost:5000";

export default function Home() {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ======================================
  // MENGAMBIL DATA BUKU DARI DATABASE
  // ======================================

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/public/books`
        );

        if (!response.ok) {
          throw new Error("Gagal mengambil data buku.");
        }

        const data = await response.json();

        // Menyesuaikan URL cover dari backend
        const formattedBooks = Array.isArray(data)
          ? data.map((book) => ({
              ...book,
              cover: book.cover
                ? book.cover.startsWith("http")
                  ? book.cover
                  : `${SERVER_URL}${book.cover}`
                : ""
            }))
          : [];

        setBooks(formattedBooks);

      } catch (err) {
        console.error("Gagal mengambil koleksi:", err);
        setError("Tidak dapat terhubung ke server.");
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  // ======================================
  // MEMBUAT KATEGORI OTOMATIS
  // ======================================

  const categories = [
    "All",
    ...new Set(
      books
        .map((book) => book.category)
        .filter(Boolean)
    )
  ];

  // ======================================
  // PENCARIAN DAN FILTER BUKU
  // ======================================

  const filteredBooks = books.filter((book) => {
    const title = (book.title || "").toLowerCase();
    const author = (book.author || "").toLowerCase();

    const matchSearch =
      title.includes(search.toLowerCase()) ||
      author.includes(search.toLowerCase());

    const matchCategory =
      category === "All" ||
      book.category === category;

    return matchSearch && matchCategory;
  });

  // ======================================
  // TAMPILAN LANDING PAGE
  // ======================================

  return (
    <>
      <Navbar />

      <Hero />

      <main className="collection-section" id="collection">

        {/* JUDUL KOLEKSI */}

        <div className="section-heading">

          <span className="section-label">
            OUR COLLECTION
          </span>

          <h2>
            Explore Our <span>Library</span>
          </h2>

          <p>
            Temukan berbagai koleksi buku untuk menambah pengetahuan.
          </p>

        </div>

        {/* PENCARIAN DAN KATEGORI */}

        <div className="collection-tools">

          <div className="search-box">

            <Search size={19} />

            <input
              type="text"
              placeholder="Cari judul atau penulis buku..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

          </div>

          <div className="category-list">

            {categories.map((item) => (

              <button
                key={item}
                className={
                  category === item ? "active" : ""
                }
                onClick={() => setCategory(item)}
              >
                {item}
              </button>

            ))}

          </div>

        </div>

        {/* DAFTAR BUKU */}

        <div className="book-grid">

          {loading ? (

            <p>Memuat koleksi buku...</p>

          ) : error ? (

            <p>{error}</p>

          ) : filteredBooks.length > 0 ? (

            filteredBooks.map((book) => (

              <BookCard
                key={book.id}
                book={book}
              />

            ))

          ) : (

            <div className="empty-state">

              <BookOpen size={35} />

              <h3>
                {books.length === 0
                  ? "Belum Ada Buku"
                  : "Buku Tidak Ditemukan"}
              </h3>

              <p>
                {books.length === 0
                  ? "Koleksi buku akan ditampilkan setelah admin menambahkan buku."
                  : "Coba gunakan kata pencarian lainnya."}
              </p>

            </div>

          )}

        </div>

      </main>

      <Footer />
    </>
  );
}
