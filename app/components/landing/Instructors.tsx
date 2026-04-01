const INSTRUCTORS = [
  {
    name: "Dr. Sarah Chen",
    role: "AI & ML",
    highlight: "48K+ learners",
    initials: "SC",
    accentBg: "var(--violet-dim)",
    accentFg: "var(--violet)",
  },
  {
    name: "James Khan",
    role: "Web Development",
    highlight: "4.9★ avg rating",
    initials: "JK",
    accentBg: "var(--gold-dim)",
    accentFg: "var(--gold)",
  },
  {
    name: "Lina Park",
    role: "Product Design",
    highlight: "120+ lessons",
    initials: "LP",
    accentBg: "var(--teal-dim)",
    accentFg: "var(--teal)",
  },
] as const;

export default function Instructors() {
  return (
    <section className="section" id="instructors">
      <div className="container">
        <div className="section-header">
          <span className="eyebrow">Instructors</span>
          <h2 className="display-lg">
            Learn from <span className="text-gold">experts</span>
          </h2>
          <p>
            Top instructors with real-world experience, clear teaching, and
            project-first curricula.
          </p>
        </div>

        <div className="grid-3">
          {INSTRUCTORS.map((i) => (
            <div key={i.name} className="d-card">
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 999,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--font-display)",
                    fontWeight: 800,
                    fontSize: 13,
                    background: i.accentBg,
                    color: i.accentFg,
                    border: `1px solid var(--border-default)`,
                  }}
                >
                  {i.initials}
                </div>

                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 800 }}>
                    {i.name}
                  </div>
                  <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>{i.role}</div>
                </div>

                <span className="pill pill-gold" style={{ marginLeft: "auto" }}>
                  Verified
                </span>
              </div>

              <div style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 16 }}>
                {i.highlight}
              </div>

              <a className="btn btn-primary btn-sm" href="#explore">
                View courses →
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
