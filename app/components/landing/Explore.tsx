"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getCourseHref, useCatalogCourses } from "@/app/lib/course-catalog";
import {
  getWishlistCourseIds,
  toggleWishlistCourse,
  WISHLIST_STORAGE_KEY,
  WISHLIST_UPDATED_EVENT,
} from "@/app/lib/wishlist-data";

export default function Explore() {
  const { courses, loading } = useCatalogCourses();
  const [wishlistRevision, setWishlistRevision] = useState(0);

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

  const trendingCourses = useMemo(() => {
    return [...courses]
      .sort((left, right) => {
        const bestsellerDiff = Number(right.isBestseller) - Number(left.isBestseller);
        if (bestsellerDiff !== 0) return bestsellerDiff;

        const ratingDiff = Number.parseFloat(right.rating) - Number.parseFloat(left.rating);
        if (ratingDiff !== 0) return ratingDiff;

        return right.totalReviews - left.totalReviews;
      })
      .slice(0, 8);
  }, [courses]);

  return (
    <section className="section explore" id="explore" style={{ paddingTop: 120 }}>
      <div className="container">
        <div className="explore-header">
          <div className="explore-badge">• 15+ COURSES</div>
          <h2 className="explore-title">
            Trending <span className="text-gold">Courses</span>
          </h2>
          <p className="explore-sub">
            Thousands of learners already enrolled — join them today.
          </p>
        </div>

        <div className="course-grid-4">
          {trendingCourses.map((c) => (
            <article key={c.slug} className="course-card" data-accent={c.accent}>
              <div className="course-cover">
                <div className="course-level">{c.level}</div>
                {c.thumbnail ? (
                  <div
                    className="course-cover-image"
                    aria-hidden
                    style={{ backgroundImage: `url(${c.thumbnail})` }}
                  />
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
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      className="course-view"
                      onClick={() => toggleWishlistCourse(c.id)}
                      style={{ minWidth: 88 }}
                    >
                      {wishlistedCourseIds.includes(c.id) ? "Saved ♥" : "Save ♡"}
                    </button>
                    <Link className="course-view" href={getCourseHref(c)}>
                      View →
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {loading && (
          <p style={{ marginTop: 14, color: "var(--text-secondary)", fontSize: 12 }}>
            Loading live course catalog... Showing up to 8 courses.
          </p>
        )}

        <div className="explore-cta">
          <Link className="explore-viewall" href="/explore">
            View All 15+ Courses →
          </Link>
        </div>
      </div>
    </section>
  );
}
