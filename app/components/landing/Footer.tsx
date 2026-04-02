"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Link
              className="nav-logo"
              href="/"
              style={{ display: "inline-flex", marginBottom: 2 }}
            >
              <div className="nav-logo-mark" aria-hidden>
                ⚡
              </div>
              SkillForge
            </Link>
            <p className="footer-brand-desc">
              Empowering the next generation of professionals through expert-led,
              AI-enhanced online education. Built with Next.js + TypeScript.
            </p>
            <div className="social-row">
              <a className="social-icon" href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="X">
                𝕏
              </a>
              <a className="social-icon" href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                in
              </a>
              <a className="social-icon" href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                ▶
              </a>
              <a className="social-icon" href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                📷
              </a>
            </div>
          </div>

          <div className="footer-col">
            <h4>Platform</h4>
            <Link className="footer-link" href="/explore">
              Browse Courses
            </Link>
            <a className="footer-link" href="/#about">
              About
            </a>
            <Link className="footer-link" href="/contact">
              Contact
            </Link>
          </div>

          <div className="footer-col">
            <h4>Company</h4>
            <a className="footer-link" href="/#about">
              About Us
            </a>
            <Link className="footer-link" href="/contact">
              Partnerships
            </Link>
          </div>

          <div className="footer-col">
            <h4>Support</h4>
            <Link className="footer-link" href="/contact">
              Help Center
            </Link>
            <Link className="footer-link" href="/contact">
              Contact Us
            </Link>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} SkillForge Inc. All rights reserved.</span>
          <div className="footer-badge">
            <div className="footer-badge-dot" />All systems operational
          </div>
          <span>Built with Next.js · TypeScript · Tailwind CSS</span>
        </div>
      </div>
    </footer>
  );
}
