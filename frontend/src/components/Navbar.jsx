
import { useState } from "react";
import { BookOpen, Menu, X, ShieldCheck } from "lucide-react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="navbar">
      <a href="#" className="brand">
        <div className="brand-icon">
          <BookOpen size={23} />
        </div>
        <span>SECURE<span className="green">LIB</span></span>
      </a>

      <div className={`nav-links ${open ? "show" : ""}`}>
        <a href="#home" onClick={() => setOpen(false)}>Home</a>
        <a href="#collection" onClick={() => setOpen(false)}>Collection</a>
        <a href="#about" onClick={() => setOpen(false)}>About</a>
      </div>

      <a href="/admin" className="admin-button">
        <ShieldCheck size={17} />
        Admin Login
      </a>

      <button className="menu-button" onClick={() => setOpen(!open)}>
        {open ? <X /> : <Menu />}
      </button>
    </nav>
  );
}
