const FAQS = [
  {
    q: "Is SkillForge free?",
    a: "You can start for free. Some advanced courses and features may require a paid plan later.",
  },
  {
    q: "Do I get certificates?",
    a: "Yes — completed courses can generate a shareable certificate to add to your CV or LinkedIn.",
  },
  {
    q: "Can I learn on mobile?",
    a: "Yes. SkillForge works well on phones and tablets so you can learn anywhere.",
  },
  {
    q: "How do instructors get approved?",
    a: "Instructors go through a verification process and content quality review before publishing.",
  },
  {
  q: "How do I enroll in a course?",
  a: "Simply browse courses, click on your desired course, and hit the enroll button to get started instantly.",
},
{
  q: "Can I track my progress?",
  a: "Yes — you can monitor your learning progress, completed lessons, and performance from your dashboard.",
},
{
  q: "Are the courses beginner-friendly?",
  a: "Absolutely. Many courses are designed for beginners, with step-by-step guidance and easy explanations.",
},
{
  q: "Can I access courses after completion?",
  a: "Yes, once you enroll in a course, you can revisit the content anytime unless specified otherwise.",
}
] as const;

export default function FAQ() {
  return (
    <section
      className="section"
      id="faq"
      style={{
        background: "var(--bg-surface)",
        borderTop: "1px solid var(--border-subtle)",
      }}
    >
      <div className="container">
        <div className="section-header">
          <span className="eyebrow">FAQ</span>
          <h2 className="display-lg">
            Quick <span className="text-gold">answers</span>
          </h2>
          <p>
            Common questions about learning, instructors, and getting started.
          </p>
        </div>

        <div className="faq-grid">
          {FAQS.map((item, idx) => (
            <details key={item.q} className="faq-item" open={idx === 0}>
              <summary className="faq-q">
                <span>{item.q}</span>
                <span className="faq-icon" aria-hidden>
                  +
                </span>
              </summary>
              <div className="faq-a">{item.a}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
