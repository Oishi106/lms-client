export default function About() {
  return (
    <section className="section" id="about" style={{ paddingTop: 120 }}>
      <div className="container">
        <div className="section-header">
          <span className="eyebrow">Our Story</span>
          <h2 className="display-lg">
            Built for the <span className="text-gold">Curious</span>
          </h2>
          <p>
            We believe education is the most powerful force for human progress.
            SkillForge was built to make world-class learning accessible to
            everyone, everywhere.
          </p>
        </div>

        <div className="grid-3">
          <div className="d-card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 44, marginBottom: 16 }}>🎯</div>
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                marginBottom: 10,
              }}
            >
              Our Mission
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
              To democratize high-quality education and empower every learner to
              unlock their full potential.
            </p>
          </div>

          <div className="d-card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 44, marginBottom: 16 }}>👁</div>
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                marginBottom: 10,
              }}
            >
              Our Vision
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
              A world where skills — not credentials — determine opportunity.
              Where anyone can learn from the best minds on the planet.
            </p>
          </div>

          <div className="d-card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 44, marginBottom: 16 }}>💡</div>
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                marginBottom: 10,
              }}
            >
              Our Values
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
              Quality over quantity. Learner-first design. AI that augments,
              never replaces, human creativity.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
