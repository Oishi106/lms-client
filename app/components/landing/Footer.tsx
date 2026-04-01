export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <a
              className="nav-logo"
              href="#home"
              style={{ display: "inline-flex", marginBottom: 2 }}
            >
              <div className="nav-logo-mark" aria-hidden>
                ⚡
              </div>
              SkillForge
            </a>
            <p className="footer-brand-desc">
              Empowering the next generation of professionals through expert-led,
              AI-enhanced online education. Built with Next.js + TypeScript.
            </p>
            <div className="social-row">
              <a className="social-icon" href="#" aria-label="X">
                𝕏
              </a>
              <a className="social-icon" href="#" aria-label="LinkedIn">
                in
              </a>
              <a className="social-icon" href="#" aria-label="YouTube">
                ▶
              </a>
              <a className="social-icon" href="#" aria-label="Instagram">
                📷
              </a>
            </div>
          </div>

          <div className="footer-col">
            <h4>Platform</h4>
            <a className="footer-link" href="#home">
              Browse Courses
            </a>
            <a className="footer-link" href="#about">
              About
            </a>
            <a className="footer-link" href="#contact">
              Contact
            </a>
          </div>

          <div className="footer-col">
            <h4>Company</h4>
            <a className="footer-link" href="#about">
              About Us
            </a>
            <a className="footer-link" href="#contact">
              Partnerships
            </a>
          </div>

          <div className="footer-col">
            <h4>Support</h4>
            <a className="footer-link" href="#contact">
              Help Center
            </a>
            <a className="footer-link" href="#contact">
              Contact Us
            </a>
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
