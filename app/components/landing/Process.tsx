const STEPS = [
  {
    n: "01",
    title: "Search for your course",
    desc: "Browse trending courses, explore categories, and pick a path that matches your goals.",
    icon: "🔎",
  },
  {
    n: "02",
    title: "Take a Sample Lesson",
    desc: "Preview the teaching style, difficulty level, and course outcomes before committing.",
    icon: "🧑‍🏫",
  },
  {
    n: "03",
    title: "Preview the Syllabus",
    desc: "Check modules, projects, and timelines so you know exactly what you’ll learn.",
    icon: "📋",
  },
  {
    n: "04",
    title: "Purchase the Course",
    desc: "Enroll securely and start learning right away with your dashboard and progress tracking.",
    icon: "🛒",
  },
] as const;

export default function Process() {
  return (
    <section className="section process" id="process">
      <div className="container">
        <div className="process-header">
          <h2 className="display-lg">
            Our <span className="text-gold">Process</span>
          </h2>
          <div className="process-kicker-line" aria-hidden />
        </div>

        <div className="process-timeline" aria-label="Our process steps">
          {STEPS.map((s, idx) => {
            const side = idx % 2 === 0 ? "left" : "right";
            return (
              <div key={s.n} className={`process-row ${side}`}>
                <div className="process-card">
                  <div className="process-step">Step {s.n}</div>
                  <div className="process-title">{s.title}</div>
                  <div className="process-divider" aria-hidden />
                  <div className="process-desc">{s.desc}</div>
                </div>

                <div className="process-node" aria-hidden>
                  <div className="process-dot" />
                </div>

                <div className="process-icon" aria-hidden>
                  {s.icon}
                </div>
              </div>
            );
          })}

          <div className="process-end" aria-hidden />
        </div>
      </div>
    </section>
  );
}
