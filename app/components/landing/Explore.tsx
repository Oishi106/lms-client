import Link from "next/link";

const TRENDING = [
  {
    level: "BEGINNER",
    accent: "violet",
    icon: "🤖",
    tag: "AI & ML",
    rating: "4.9",
    reviews: "12.4k",
    title: "Complete Machine Learning Bootcamp 2025",
    byline: "by Dr. Sarah Chen · 48.2k students",
    duration: "42h",
    price: "$89",
    oldPrice: "$109",
  },
  {
    level: "INTERMEDIATE",
    accent: "teal",
    icon: "⚛️",
    tag: "Development",
    rating: "4.8",
    reviews: "9.8k",
    title: "React & Next.js Masterclass 2025",
    byline: "by Marcus Reid · 62.1k students",
    duration: "38h",
    price: "$79",
    oldPrice: "$159",
  },
  {
    level: "BEGINNER",
    accent: "rose",
    icon: "🎨",
    tag: "Design",
    rating: "4.9",
    reviews: "8.2k",
    title: "Complete UI/UX Design Bootcamp",
    byline: "by Aisha Nwosu · 31.4k students",
    duration: "28h",
    price: "$99",
    oldPrice: "$189",
  },
  {
    level: "BEGINNER",
    accent: "green",
    icon: "📊",
    tag: "Data Science",
    rating: "4.7",
    reviews: "15.1k",
    title: "Python for Data Science & ML",
    byline: "by Tom Katsuiki · 55.3k students",
    duration: "35h",
    price: "$69",
    oldPrice: "$149",
  },
] as const;

export default function Explore() {
  return (
    <section className="section explore" id="explore" style={{ paddingTop: 120 }}>
      <div className="container">
        <div className="explore-header">
          <div className="explore-badge">• Most Popular</div>
          <h2 className="explore-title">
            Trending <span className="text-gold">Courses</span>
          </h2>
          <p className="explore-sub">
            Thousands of learners already enrolled — join them today.
          </p>
        </div>

        <div className="explore-toolbar">
          <div className="explore-search">
            <span className="explore-search-icon" aria-hidden>
              🔍
            </span>
            <input
              className="explore-search-input"
              type="text"
              placeholder="Search courses..."
              aria-label="Search courses"
            />
          </div>

          <div className="explore-tabs" role="tablist" aria-label="Course categories">
            <button className="explore-tab active" type="button" role="tab" aria-selected>
              All
            </button>
            <button className="explore-tab" type="button" role="tab">
              Development
            </button>
            <button className="explore-tab" type="button" role="tab">
              Design
            </button>
            <button className="explore-tab" type="button" role="tab">
              AI &amp; ML
            </button>
            <button className="explore-tab" type="button" role="tab">
              Data Science
            </button>
          </div>
        </div>

        <div className="course-grid-4">
          {TRENDING.map((c) => (
            <article key={c.title} className="course-card" data-accent={c.accent}>
              <div className="course-cover">
                <div className="course-level">{c.level}</div>
                <div className="course-icon" aria-hidden>
                  {c.icon}
                </div>
              </div>

              <div className="course-body">
                <div className="course-meta">
                  <span className="course-tag">
                    <span className="course-dot" aria-hidden />
                    {c.tag}
                  </span>
                  <span className="course-rating">
                    <span aria-hidden style={{ color: "var(--gold)" }}>
                      ★
                    </span>
                    {c.rating}
                    <span className="course-reviews">({c.reviews})</span>
                  </span>
                </div>

                <h3 className="course-title">{c.title}</h3>
                <p className="course-byline">{c.byline}</p>

                <div className="course-stats">
                  <span>
                    <span aria-hidden style={{ marginRight: 6 }}>
                      ★
                    </span>
                    {c.rating} rating
                  </span>
                  <span>
                    <span aria-hidden style={{ marginRight: 6 }}>
                      ⏱
                    </span>
                    {c.duration}
                  </span>
                </div>

                <div className="course-foot">
                  <div className="course-price">
                    <span className="course-price-now">{c.price}</span>
                    <span className="course-price-old">{c.oldPrice}</span>
                  </div>
                  <button className="course-view" type="button">
                    View →
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="explore-cta">
          <Link className="explore-viewall" href="/explore">
            View All 1,200+ Courses →
          </Link>
        </div>
      </div>
    </section>
  );
}
