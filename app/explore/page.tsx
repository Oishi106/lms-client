"use client";

import Navbar from "../components/landing/Navbar";
import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { COURSES, FILTER_CATEGORIES, FILTER_LEVELS } from "../lib/courses-data";
import { getManagedCoursesClient, getDefaultManagedCourses, subscribeManagedCourses } from "@/app/lib/managed-courses-data";

type SortOption = "popular" | "new" | "rating" | "price";

const parsePrice = (value: string): number => {
  const numeric = Number.parseFloat(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
};

const parseRating = (value: string): number => {
  const numeric = Number.parseFloat(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const parseReviews = (value: string): number => {
  const raw = value.trim().toLowerCase();
  const numeric = Number.parseFloat(raw.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(numeric)) return 0;
  if (raw.includes("m")) return numeric * 1_000_000;
  if (raw.includes("k")) return numeric * 1_000;
  return numeric;
};

const normalizeLevelLabel = (label: string) => label.toUpperCase();

export default function ExplorePage() {
  const coursesSnapshot = useSyncExternalStore(
    subscribeManagedCourses,
    () => JSON.stringify(getManagedCoursesClient()),
    () => JSON.stringify(getDefaultManagedCourses())
  );

  const managedCourses = useMemo(() => JSON.parse(coursesSnapshot) as typeof COURSES, [coursesSnapshot]);

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedRatings, setSelectedRatings] = useState<number[]>([]);
  const [maxPrice, setMaxPrice] = useState(200);
  const [sortBy, setSortBy] = useState<SortOption>("popular");

  const [appliedCategories, setAppliedCategories] = useState<string[]>([]);
  const [appliedLevels, setAppliedLevels] = useState<string[]>([]);
  const [appliedRatings, setAppliedRatings] = useState<number[]>([]);
  const [appliedMaxPrice, setAppliedMaxPrice] = useState(200);
  const [appliedSortBy, setAppliedSortBy] = useState<SortOption>("popular");

  const toggleInList = <T,>(list: T[], value: T) =>
    list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

  const filteredCourses = useMemo(() => {
    const result = managedCourses.filter((course) => {
      const byCategory = appliedCategories.length === 0 || appliedCategories.includes(course.tag);
      const byLevel =
        appliedLevels.length === 0 ||
        appliedLevels.map(normalizeLevelLabel).includes(course.level);

      const coursePrice = parsePrice(course.price);
      const byPrice = coursePrice <= appliedMaxPrice;

      const courseRating = parseRating(course.rating);
      const byRating =
        appliedRatings.length === 0 ||
        appliedRatings.some((threshold) => courseRating >= threshold);

      return byCategory && byLevel && byPrice && byRating;
    });

    if (appliedSortBy === "new") {
      return [...result].reverse();
    }

    if (appliedSortBy === "rating") {
      return [...result].sort((a, b) => parseRating(b.rating) - parseRating(a.rating));
    }

    if (appliedSortBy === "price") {
      return [...result].sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
    }

    return [...result].sort((a, b) => parseReviews(b.reviews) - parseReviews(a.reviews));
  }, [managedCourses, appliedCategories, appliedLevels, appliedRatings, appliedMaxPrice, appliedSortBy]);

  const applyFilters = () => {
    setAppliedCategories(selectedCategories);
    setAppliedLevels(selectedLevels);
    setAppliedRatings(selectedRatings);
    setAppliedMaxPrice(maxPrice);
    setAppliedSortBy(sortBy);
  };

  const resetFilters = () => {
    setSelectedCategories([]);
    setSelectedLevels([]);
    setSelectedRatings([]);
    setMaxPrice(200);
    setSortBy("popular");

    setAppliedCategories([]);
    setAppliedLevels([]);
    setAppliedRatings([]);
    setAppliedMaxPrice(200);
    setAppliedSortBy("popular");
  };

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
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(c.label)}
                          onChange={() => setSelectedCategories((prev) => toggleInList(prev, c.label))}
                        />
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
                    <span className="filter-range-max">${maxPrice}</span>
                  </div>
                  <input
                    className="filter-range-input"
                    type="range"
                    min={0}
                    max={200}
                    value={maxPrice}
                    onChange={(event) => setMaxPrice(Number(event.target.value))}
                  />
                </div>
              </div>

              <div className="filter-section">
                <div className="filter-label">Rating</div>
                <div className="filter-list">
                  {[5, 4, 3].map((stars) => (
                    <label key={stars} className="filter-item">
                      <span className="filter-item-left">
                        <input
                          type="checkbox"
                          checked={selectedRatings.includes(stars)}
                          onChange={() => setSelectedRatings((prev) => toggleInList(prev, stars))}
                        />
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
                        <input
                          type="checkbox"
                          checked={selectedLevels.includes(lvl.label)}
                          onChange={() => setSelectedLevels((prev) => toggleInList(prev, lvl.label))}
                        />
                        <span>{lvl.label}</span>
                      </span>
                      <span className="filter-count">{lvl.count}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: "grid", gap: "10px" }}>
                <button
                  className="btn btn-primary"
                  type="button"
                  style={{ width: "100%", justifyContent: "center" }}
                  onClick={applyFilters}
                >
                  Apply Filters
                </button>
                <button
                  className="btn btn-ghost"
                  type="button"
                  style={{ width: "100%", justifyContent: "center" }}
                  onClick={resetFilters}
                >
                  Reset Filters
                </button>
              </div>
            </aside>

            <section className="explore-results" aria-label="Course results">
              <div className="explore-topbar">
                <div className="explore-count">Showing {filteredCourses.length} courses</div>
                <div className="explore-sort">
                  <select
                    className="explore-sort-select"
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value as SortOption)}
                  >
                    <option value="popular">Most Popular</option>
                    <option value="new">Newest</option>
                    <option value="rating">Highest Rated</option>
                    <option value="price">Lowest Price</option>
                  </select>
                </div>
              </div>

              <div className="course-grid-3">
                {filteredCourses.map((c) => (
                  <Link key={c.id} href={`/course/${c.id}`}>
                    <article className="course-card" data-accent={c.accent}>
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
                  </Link>
                ))}
              </div>

              {filteredCourses.length === 0 && (
                <div
                  style={{
                    border: "1px solid var(--border-default)",
                    borderRadius: 12,
                    padding: "20px",
                    color: "var(--text-secondary)",
                    background: "var(--bg-surface)",
                    textAlign: "center",
                    marginTop: "8px",
                  }}
                >
                  No course found for current filters. Try a higher price range or fewer filter selections.
                </div>
              )}

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
