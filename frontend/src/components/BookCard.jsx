
import { useState } from "react";
import { Star, BookOpen } from "lucide-react";

export default function BookCard({ book }) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="book-card">

      <div className="book-cover">

        {book.cover && !imageError ? (
          <img
            src={book.cover}
            alt={`Sampul ${book.title}`}
            onError={() => setImageError(true)}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: "10px",
              color: "#10b981"
            }}
          >
            <BookOpen size={45} />

            <span style={{ fontSize: "12px" }}>
              AMAN LIB
            </span>
          </div>
        )}

        {book.year && (
          <span className="book-year">
            {book.year}
          </span>
        )}

      </div>

      <div className="book-info">

        <span className="book-category">
          {book.category}
        </span>

        <h3>{book.title}</h3>

        <p>{book.author}</p>

        <div className="book-rating">
          <Star size={15} fill="currentColor" />
          <span>4.8</span>
        </div>

      </div>

    </div>
  );
}
