import Navbar from "../components/landing/Navbar";

const FILTER_CATEGORIES = [
  { label: "Development", count: 342 },
  { label: "Design", count: 218 },
  { label: "AI & ML", count: 156 },
  { label: "Data Science", count: 205 },
  { label: "Business", count: 112 },
] as const;

const FILTER_LEVELS = [
  { label: "Beginner", count: 280 },
  { label: "Intermediate", count: 140 },
  { label: "Advanced", count: 60 },
] as const;

const COURSES = [
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
  {
    level: "EXPERT",
    accent: "gold",
    icon: "☁️",
    tag: "Cloud & DevOps",
    rating: "4.8",
    reviews: "6.4k",
    title: "AWS Cloud Architect Certification",
    byline: "by Priya Sharma · 24.1k students",
    duration: "30h",
    price: "$119",
    oldPrice: "$189",
  },
  {
    level: "ADVANCED",
    accent: "teal",
    icon: "🔒",
    tag: "Cybersecurity",
    rating: "4.8",
    reviews: "5.2k",
    title: "Ethical Hacking & Cybersecurity",
    byline: "by Daniel Cross · 22.8k students",
    duration: "32h",
    price: "$89",
    oldPrice: "$169",
  },
  {
    level: "INTERMEDIATE",
    accent: "violet",
    icon: "📱",
    tag: "Mobile Dev",
    rating: "4.7",
    reviews: "4.8k",
    title: "iOS & Android App Development",
    byline: "by Yuki Tanaka · 18.3k students",
    duration: "26h",
    price: "$99",
    oldPrice: "$179",
  },
  {
    level: "ADVANCED",
    accent: "rose",
    icon: "🧠",
    tag: "AI & ML",
    rating: "4.8",
    reviews: "7.1k",
    title: "Deep Learning with PyTorch",
    byline: "by Dr. Sarah Chen · 29.6k students",
    duration: "29h",
    price: "$109",
    oldPrice: "$199",
  },
] as const;

export default function ExplorePage() {
  return (
    <>
      <Navbar />
      <main className="explore-page">
        <div className="container">
          <header className="explore-page-header">
            <div className="explore-page-badge">• 1,200+ COURSES</div>
            <h1 className="explore-page-title">
              Explore All <span className="text-gold">Courses</span>
            </h1>
            <p className="explore-page-sub">
              Find your perfect course from our expert-crafted library.
            </p>
          </header>

          <div className="explore-layout">
            <aside className="filter-card" aria-label="Filters">
              <div className="filter-title">Filters</div>

              <div className="filter-section">
                <div className="filter-label">Category</div>
                <div className="filter-list">
                  {FILTER_CATEGORIES.map((c) => (
                    <label key={c.label} className="filter-item">
                      <span className="filter-item-left">
                        <input type="checkbox" defaultChecked={c.label === "Development"} />
                        <span>{c.label}</span>
                      </span>
                      <span className="filter-count">{c.count}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="filter-section">
                <div className="filter-label">Price Range</div>
                <div className="filter-range">
                  <div className="filter-range-row">
                    <span className="filter-range-min">$0</span>
                    <span className="filter-range-max">$200</span>
                  </div>
                  <input className="filter-range-input" type="range" min={0} max={200} defaultValue={120} />
                </div>
              </div>

              <div className="filter-section">
                <div className="filter-label">Rating</div>
                <div className="filter-list">
                  {[5, 4, 3].map((stars) => (
                    <label key={stars} className="filter-item">
                      <span className="filter-item-left">
                        <input type="checkbox" defaultChecked={stars === 4} />
                        <span className="filter-stars" aria-label={`${stars} stars and up`}>
                          {"★".repeat(stars)}
                          <span className="filter-stars-dim">{"★".repeat(5 - stars)}</span>
                          <span className="filter-stars-text">&nbsp;({stars}.0+)</span>
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="filter-section">
                <div className="filter-label">Level</div>
                <div className="filter-list">
                  {FILTER_LEVELS.map((lvl) => (
                    <label key={lvl.label} className="filter-item">
                      <span className="filter-item-left">
                        <input type="checkbox" defaultChecked={lvl.label === "Beginner"} />
                        <span>{lvl.label}</span>
                      </span>
                      <span className="filter-count">{lvl.count}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button className="btn btn-primary" type="button" style={{ width: "100%", justifyContent: "center" }}>
                Apply Filters
              </button>
            </aside>

            <section className="explore-results" aria-label="Course results">
              <div className="explore-topbar">
                <div className="explore-count">Showing 480 courses</div>
                <div className="explore-sort">
                  <select className="explore-sort-select" defaultValue="popular">
                    <option value="popular">Most Popular</option>
                    <option value="new">Newest</option>
                    <option value="rating">Highest Rated</option>
                    <option value="price">Lowest Price</option>
                  </select>
                </div>
              </div>

              <div className="course-grid-3">
                {COURSES.map((c) => (
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

              <div className="pagination" aria-label="Pagination">
                <button className="page-item active" type="button">
                  1
                </button>
                <button className="page-item" type="button">
                  2
                </button>
                <button className="page-item" type="button">
                  3
                </button>
                <button className="page-item" type="button">
                  4
                </button>
                <button className="page-item" type="button">
                  5
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
