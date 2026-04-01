const CATEGORIES = [
  { label: "Web Development", pill: "pill-gold", icon: "🌐" },
  { label: "Data & Analytics", pill: "pill-teal", icon: "📈" },
  { label: "AI & Machine Learning", pill: "pill-violet", icon: "🤖" },
  { label: "UI/UX Design", pill: "pill-rose", icon: "🎨" },
  { label: "Cloud & DevOps", pill: "pill-teal", icon: "☁️" },
  { label: "Cyber Security", pill: "pill-rose", icon: "🛡️" },
  { label: "Mobile Development", pill: "pill-gold", icon: "📱" },
  { label: "Business", pill: "pill-violet", icon: "💼" },
] as const;

export default function Categories() {
  return (
    <section
      className="section"
      id="categories"
      style={{
        background: "var(--bg-surface)",
        borderTop: "1px solid var(--border-subtle)",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      <div className="container">
        <div className="section-header">
          <span className="eyebrow">Categories</span>
          <h2 className="display-lg">
            Learn by <span className="text-gold">category</span>
          </h2>
          <p>
            Pick a category and start with beginner-friendly courses or jump
            straight into advanced tracks.
          </p>
        </div>

        <div className="cat-chip-row" aria-label="Top categories">
          {CATEGORIES.slice(0, 6).map((c) => (
            <a key={c.label} className="cat-chip" href="#explore">
              <span aria-hidden>{c.icon}</span>
              {c.label}
            </a>
          ))}
        </div>

        <div className="grid-4">
          {CATEGORIES.map((c) => (
            <div key={c.label} className="d-card cat-card">
              <div className="cat-card-top">
                <div className="cat-icon" aria-hidden>
                  {c.icon}
                </div>
                <span className={`pill ${c.pill}`}>Popular</span>
              </div>
              <h3 className="cat-title">{c.label}</h3>
              <p className="cat-desc">Curated courses and projects to get you job-ready.</p>
              <a className="btn btn-ghost btn-sm" href="#explore">
                Explore →
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
