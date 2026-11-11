
import { ShieldCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="footer" id="about">
      <div className="footer-brand">
        <ShieldCheck size={20} />
        SECURE<span>LIB</span>
      </div>
      <p>Knowledge is valuable. Protect it securely.</p>
      <small>© 2026 Secure Digital Library. All rights reserved.</small>
    </footer>
  );
}
