"use client";

import { useState } from "react";

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <section
      className="section"
      id="contact"
      style={{ background: "var(--bg-surface)", borderTop: "1px solid var(--border-subtle)", borderBottom: "1px solid var(--border-subtle)" }}
    >
      <div className="container">
        <div className="section-header">
          <span className="eyebrow">Contact</span>
          <h2 className="display-lg">
            Let’s Talk <span className="text-gold">Learning</span>
          </h2>
          <p>
            Have a question, feedback, or want to partner? Send a message and
            we’ll get back to you.
          </p>
        </div>

        <div className="d-card" style={{ maxWidth: 760, margin: "0 auto" }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(true);
            }}
          >
            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">Name</label>
                <input className="input-field" type="text" placeholder="Your name" required />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="input-field" type="email" placeholder="you@example.com" required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Message</label>
              <textarea
                className="input-field"
                rows={5}
                placeholder="Tell us what you need..."
                required
              />
            </div>

            {submitted ? (
              <div className="success-banner show" style={{ display: "block" }}>
                ✅ Thanks! We received your message.
              </div>
            ) : null}

            <button className="btn btn-primary" type="submit">
              Send Message →
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
