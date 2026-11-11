
import { ArrowRight, ShieldCheck, BookOpen, LockKeyhole } from "lucide-react";

export default function Hero() {
  return (
    <section className="hero" id="home">
      <div className="hero-content">
        <div className="hero-label">
          <ShieldCheck size={16} />
          SECURE DIGITAL LIBRARY
        </div>

        <h1>
          Explore Knowledge.
          <br />
          <span>Secure Your World.</span>
        </h1>

        <p>
          Discover a world of knowledge through our digital library.
          Every piece of information is protected with modern data
          encryption technology.
        </p>

        <div className="hero-actions">
          <a href="#collection" className="primary-button">
            Explore Collection <ArrowRight size={18} />
          </a>
          <a href="/admin" className="secondary-button">
            <LockKeyhole size={17} /> Admin Access
          </a>
        </div>

        <div className="hero-stats">
          <div>
            <h3>1,200+</h3>
            <span>Digital Books</span>
          </div>
          <div>
            <h3>500+</h3>
            <span>Readers</span>
          </div>
          <div>
            <h3>AES-256</h3>
            <span>Encryption</span>
          </div>
        </div>
      </div>

      <div className="hero-visual">
        <div className="glow"></div>
        <div className="book-illustration">
          <BookOpen size={110} strokeWidth={1} />
          <div className="orbit orbit-one"></div>
          <div className="orbit orbit-two"></div>
          <div className="security-card">
            <ShieldCheck size={22} />
            <div>
              <strong>Data Protected</strong>
              <span>Secure Encryption</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
