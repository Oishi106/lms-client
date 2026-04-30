"use client";

import Navbar from "../components/landing/Navbar";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FILTER_CATEGORIES, FILTER_LEVELS } from "../lib/courses-data";
import { useCatalogCourses } from "@/app/lib/course-catalog";
import {
  getWishlistCourseIds,
  toggleWishlistCourse,
  WISHLIST_STORAGE_KEY,
  WISHLIST_UPDATED_EVENT,
} from "@/app/lib/wishlist-data";

type SortOption = "popular" | "new" | "highestPrice" | "lowestPrice";

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
  const { courses, loading, error } = useCatalogCourses();
  const categoryOptions = useMemo(
    () =>
      FILTER_CATEGORIES.map((item) => ({
        ...item,
        count: courses.filter((course) => course.tag === item.label).length,
      })),
    [courses]
  );
  const levelOptions = useMemo(
    () =>
      FILTER_LEVELS.map((item) => ({
        ...item,
        count: courses.filter((course) => course.level === normalizeLevelLabel(item.label)).length,
      })),
    [courses]
  );

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
  const [currentPage, setCurrentPage] = useState(1);
  const [wishlistRevision, setWishlistRevision] = useState(0);
  const itemsPerPage = 9;

  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    const syncWishlist = () => setWishlistRevision((value) => value + 1);

    const onStorage = (event: StorageEvent) => {
      if (event.key === WISHLIST_STORAGE_KEY) syncWishlist();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(WISHLIST_UPDATED_EVENT, syncWishlist);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(WISHLIST_UPDATED_EVENT, syncWishlist);
    };
  }, []);

  const wishlistedCourseIds = wishlistRevision >= 0 ? getWishlistCourseIds() : [];

  const handleView = (id: string) => {
    if (status !== "authenticated") {
      router.push("/login");
      return;
    }
    router.push(`/course/${id}`);
  };

  const toggleInList = <T,>(list: T[], value: T) =>
    list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

  const filteredCourses = useMemo(() => {
    const result = courses.filter((course) => {
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

    if (appliedSortBy === "highestPrice") {
      return [...result].sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
    }

    if (appliedSortBy === "lowestPrice") {
      return [...result].sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
    }

    return [...result].sort((a, b) => parseReviews(b.reviews) - parseReviews(a.reviews));
  }, [courses, appliedCategories, appliedLevels, appliedRatings, appliedMaxPrice, appliedSortBy]);

  const totalPages = Math.min(2, Math.max(1, Math.ceil(filteredCourses.length / itemsPerPage)));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedCourses = useMemo(() => {
    const startIndex = (safePage - 1) * itemsPerPage;
    return filteredCourses.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCourses, safePage]);

  const applyFilters = () => {
    setAppliedCategories(selectedCategories);
    setAppliedLevels(selectedLevels);
    setAppliedRatings(selectedRatings);
    setAppliedMaxPrice(maxPrice);
    setAppliedSortBy(sortBy);
    setCurrentPage(1);
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
    setCurrentPage(1);
  };

  return (
    <>
      <Navbar />
      <main className="explore-page">
        <div className="container">
          <header className="explore-page-header">
            <div className="explore-page-badge">• 15+ COURSES</div>
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
                  {categoryOptions.map((c) => (
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
                  {levelOptions.map((lvl) => (
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
                    onChange={(event) => {
                      const nextSort = event.target.value as SortOption;
                      setSortBy(nextSort);
                      setAppliedSortBy(nextSort);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="popular">Most Popular</option>
                    <option value="new">Newest</option>
                    <option value="highestPrice">Highest Price</option>
                    <option value="lowestPrice">Lowest Price</option>
                  </select>
                </div>
              </div>

              <div className="course-grid-3">
                {paginatedCourses.map((c) => (
                  <div key={c.slug}>
                    <article className="course-card" data-accent={c.accent}>
                      <div className="course-cover">
                        <div className="course-level">{c.level}</div>
                        {c.thumbnail ? (
                          <div className="course-cover-image" aria-hidden style={{ backgroundImage: `url(${c.thumbnail})` }} />
                        ) : (
                          <div className="course-icon" aria-hidden>
                            {c.icon}
                          </div>
                        )}
                        <div className="course-cover-overlay" aria-hidden />
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
                        <p className="course-byline">Instructor: {c.instructorName}</p>
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
                          <div style={{ display: "flex", flexDirection: "column", gap: 8, justifyContent: "flex-end" }}>
                            <button
                              type="button"
                              className="course-view"
                              onClick={() => {
                                const nextSaved = toggleWishlistCourse(c.id);
                                if (nextSaved) {
                                  setCurrentPage((page) => page);
                                }
                              }}
                              style={{ minWidth: 88 }}
                            >
                              {wishlistedCourseIds.includes(c.id) ? "Saved ♥" : "Save ♡"}
                            </button>
                            <button
                              className="course-view"
                              type="button"
                              onClick={() => handleView(c.slug || c.id)}
                            >
                              View →
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  </div>
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

              {filteredCourses.length > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: "12px", flexWrap: "wrap" }}>
                  <div style={{ color: "var(--text-secondary)", fontSize: 12 }}>
                    Showing {paginatedCourses.length} of {Math.min(filteredCourses.length, 18)} courses
                  </div>
                  <div className="pagination" aria-label="Pagination" style={{ marginTop: 0 }}>
                    <button
                      className={`page-item ${safePage === 1 ? "active" : ""}`}
                      type="button"
                      onClick={() => setCurrentPage(1)}
                    >
                      1
                    </button>
                    <button
                      className={`page-item ${safePage === 2 ? "active" : ""}`}
                      type="button"
                      onClick={() => setCurrentPage(2)}
                      disabled={totalPages < 2}
                    >
                      2
                    </button>
                  </div>
                </div>
              )}

              {loading && (
                <div
                  style={{
                    border: "1px solid var(--border-default)",
                    borderRadius: 12,
                    padding: "18px",
                    color: "var(--text-secondary)",
                    background: "var(--bg-surface)",
                    textAlign: "center",
                    marginTop: "8px",
                  }}
                >
                  Syncing live course catalog...
                </div>
              )}

              {error && (
                <div
                  style={{
                    border: "1px solid rgba(255, 88, 88, 0.3)",
                    borderRadius: 12,
                    padding: "18px",
                    color: "var(--text-primary)",
                    background: "rgba(255, 88, 88, 0.06)",
                    textAlign: "center",
                    marginTop: "8px",
                  }}
                >
                  Live catalog unavailable. Showing fallback courses.
                </div>
              )}

            </section>
          </div>
        </div>
      </main>
    </>
  );
}
