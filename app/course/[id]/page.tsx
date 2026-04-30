"use client";

import { useEffect, useMemo, useRef } from "react";
import { useState } from "react";
import Navbar from "@/app/components/landing/Navbar";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import CourseDetailsTabs from "@/app/components/course/CourseDetailsTabs";
import CoursePurchaseActions from "@/app/components/course/CoursePurchaseActions";
import CourseVideoPlayer from "@/app/components/course/CourseVideoPlayer";
import { getCourseHref, useCatalogCourses } from "@/app/lib/course-catalog";
import { clearPendingCheckout, getPendingCheckout, savePaidOrder, type CourseOrder } from "@/app/lib/payments-data";
import {
  getWishlistCourseIds,
  toggleWishlistCourse,
  WISHLIST_STORAGE_KEY,
  WISHLIST_UPDATED_EVENT,
} from "@/app/lib/wishlist-data";

export default function CoursePage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { courses, loading, error } = useCatalogCourses();
  const confirmationRanRef = useRef(false);
  const [wishlistRevision, setWishlistRevision] = useState(0);

  const course = useMemo(
    () => courses.find((item) => item.slug === params.id || item.id === params.id),
    [courses, params.id]
  );

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

  const wishlistedCourseIds = useMemo(() => getWishlistCourseIds(), [wishlistRevision]);

  useEffect(() => {
    const success = searchParams.get('success') === 'true';
    const sessionId = searchParams.get('session_id');

    if (!success || confirmationRanRef.current) return;

    confirmationRanRef.current = true;

    const pendingCheckout = getPendingCheckout();
    const payload = sessionId ? { sessionId } : pendingCheckout ? { order: pendingCheckout } : null;

    if (!payload) {
      confirmationRanRef.current = false;
      return;
    }

    void fetch('/api/checkout/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(async (response) => {
        const data = (await response.json().catch(() => null)) as { ok?: boolean; order?: CourseOrder } | null;
        if (response.ok && data?.order) {
          savePaidOrder(data.order);
        }
      })
      .catch(() => {
        confirmationRanRef.current = false;
      })
      .finally(() => {
        clearPendingCheckout();
      });
  }, [searchParams]);

  if (!course && loading) {
    return (
      <>
        <Navbar />
        <main className="course-details-page">
          <div className="container">
            <div style={{ padding: "60px 20px", textAlign: "center" }}>
              <h1>Loading course...</h1>
              <p style={{ color: "var(--text-secondary)", marginTop: 12 }}>Syncing the live catalog.</p>
              <Link href="/explore" className="btn btn-primary" style={{ marginTop: "20px" }}>
                Back to Explore
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (!course) {
    return (
      <>
        <Navbar />
        <main className="course-details-page">
          <div className="container">
            <div style={{ padding: "60px 20px", textAlign: "center" }}>
              <h1>{error ? "Course catalog unavailable" : "Course not found"}</h1>
              <p style={{ color: "var(--text-secondary)", marginTop: 12 }}>
                {error ? "Showing the fallback catalog is not enough to resolve this course route." : "This course is not available in the current catalog."}
              </p>
              <Link href="/explore" className="btn btn-primary" style={{ marginTop: "20px" }}>
                Back to Explore
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  const relatedCourses = courses
    .filter((candidate) => candidate.tag === course.tag && candidate.id !== course.id)
    .slice(0, 3);

  const accentColors: Record<string, { start: string; end: string }> = {
    violet: { start: "rgba(167, 139, 250, 0.15)", end: "rgba(167, 139, 250, 0)" },
    teal: { start: "rgba(46, 232, 207, 0.15)", end: "rgba(46, 232, 207, 0)" },
    rose: { start: "rgba(255, 107, 138, 0.15)", end: "rgba(255, 107, 138, 0)" },
    gold: { start: "rgba(245, 200, 66, 0.15)", end: "rgba(245, 200, 66, 0)" },
    green: { start: "rgba(34, 197, 94, 0.15)", end: "rgba(34, 197, 94, 0)" },
  };

  const accentColor = accentColors[course.accent] || accentColors.violet;

  return (
    <>
      <Navbar />
      <main className="course-details-page">
        <div className="container">
          <div
            className="course-hero"
            style={{
              background: `linear-gradient(135deg, ${accentColor.start}, ${accentColor.end})`,
              padding: "40px 30px",
              borderRadius: "20px",
              marginBottom: "60px",
              marginTop: "40px",
              border: "1px solid var(--border-default)",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "40px",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: "300px",
                  background: "var(--bg-card)",
                  borderRadius: "16px",
                  border: "1px solid var(--border-subtle)",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                {course.thumbnail ? (
                  <img
                    alt={course.title}
                    src={course.thumbnail}
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                ) : (
                  <div style={{ fontSize: "120px" }} aria-hidden>
                    {course.icon}
                  </div>
                )}
              </div>

              <div>
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    alignItems: "center",
                    marginBottom: "16px",
                  }}
                >
                  <span
                    style={{
                      background: "var(--gold-dim)",
                      color: "var(--gold)",
                      padding: "4px 12px",
                      borderRadius: "999px",
                      fontSize: "12px",
                      fontWeight: "600",
                      textTransform: "uppercase",
                    }}
                  >
                    {course.tag}
                  </span>
                  <span style={{ color: "var(--gold)", fontSize: "14px", fontWeight: "600" }}>
                    {course.level}
                  </span>
                </div>

                <h1 style={{ fontSize: "36px", fontWeight: "700", marginBottom: "16px", lineHeight: "1.2" }}>
                  {course.title}
                </h1>

                <p style={{ color: "var(--text-secondary)", fontSize: "16px", marginBottom: "24px" }}>
                  {course.byline}
                </p>

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    alignItems: "center",
                    flexWrap: "wrap",
                    marginBottom: "18px",
                    color: "var(--text-secondary)",
                    fontSize: "13px",
                  }}
                >
                  <span>Instructor: {course.instructorName}</span>
                  <span>•</span>
                  <span>{course.instructorRole}</span>
                  <span>•</span>
                  <span>{course.totalReviews.toLocaleString()} reviews</span>
                </div>

                <div style={{ display: "flex", gap: "20px", marginBottom: "32px", fontSize: "14px" }}>
                  <div>
                    <div style={{ color: "var(--text-secondary)", fontSize: "12px", marginBottom: "4px" }}>RATING</div>
                    <div style={{ fontSize: "18px", fontWeight: "600" }}>
                      ★ {course.rating}{" "}
                      <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
                        ({course.totalReviews.toLocaleString()})
                      </span>
                    </div>
                  </div>
                  <div>
                    <div style={{ color: "var(--text-secondary)", fontSize: "12px", marginBottom: "4px" }}>DURATION</div>
                    <div style={{ fontSize: "18px", fontWeight: "600" }}>⏱ {course.duration}</div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "20px" }}>
                  <span style={{ fontSize: "32px", fontWeight: "700", color: "var(--gold)" }}>
                    {course.price}
                  </span>
                  <span style={{ fontSize: "16px", color: "var(--text-secondary)", textDecoration: "line-through" }}>
                    {course.oldPrice}
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      color: "var(--gold)",
                      background: "var(--gold-dim)",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontWeight: "600",
                    }}
                  >
                    23% OFF
                  </span>
                </div>

                <CoursePurchaseActions
                  courseId={course.id}
                  price={course.price}
                  courseTitle={course.title}
                  videoUrl={course.videoUrl}
                />

                <div style={{ display: "flex", gap: "12px", marginTop: "16px", fontSize: "12px", color: "var(--text-secondary)" }}>
                  <span>✓ {course.duration} of video content</span>
                  <span>✓ {course.lessons} lessons & exercises</span>
                </div>
                <div style={{ display: "flex", gap: "12px", marginTop: "8px", fontSize: "12px", color: "var(--text-secondary)" }}>
                  <span>✓ {course.level} level access</span>
                  <span>✓ Full lifetime access</span>
                </div>
                <div style={{ display: "flex", gap: "12px", marginTop: "8px", fontSize: "12px", color: "var(--text-secondary)" }}>
                  <span>✓ Verified certificate</span>
                  <span>✓ AI learning assistant</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "40px", marginBottom: "60px" }}>
            <div>
              <CourseVideoPlayer courseId={course.id} videoUrl={course.videoUrl} previewSeconds={course.previewSeconds ?? 300} />

              <CourseDetailsTabs course={course} />

              <section>
                <h2 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "24px", color: "var(--text-primary)" }}>
                  Related Courses
                </h2>
                <div className="course-grid-3">
                  {relatedCourses.map((relatedCourse) => (
                    <article key={relatedCourse.slug} className="course-card" data-accent={relatedCourse.accent}>
                      <div className="course-cover">
                        <div className="course-level">{relatedCourse.level}</div>
                        {relatedCourse.thumbnail ? (
                          <div className="course-cover-image" aria-hidden style={{ backgroundImage: `url(${relatedCourse.thumbnail})` }} />
                        ) : (
                          <div className="course-icon" aria-hidden>
                            {relatedCourse.icon}
                          </div>
                        )}
                        <div className="course-cover-overlay" aria-hidden />
                      </div>

                      <div className="course-body">
                        <div className="course-meta">
                          <span className="course-tag">
                            <span className="course-dot" aria-hidden />
                            {relatedCourse.tag}
                          </span>
                          <span className="course-rating">
                            <span aria-hidden style={{ color: "var(--gold)" }}>
                              ★
                            </span>
                            {relatedCourse.rating}
                            <span className="course-reviews">({relatedCourse.reviews})</span>
                          </span>
                        </div>

                        <h3 className="course-title">{relatedCourse.title}</h3>
                        <p className="course-byline">Instructor: {relatedCourse.instructorName}</p>
                        <p className="course-byline">{relatedCourse.byline}</p>

                        <div className="course-stats">
                          <span>
                            <span aria-hidden style={{ marginRight: 6 }}>
                              ★
                            </span>
                            {relatedCourse.rating} rating
                          </span>
                          <span>
                            <span aria-hidden style={{ marginRight: 6 }}>
                              ⏱
                            </span>
                            {relatedCourse.duration}
                          </span>
                        </div>

                        <div className="course-foot">
                          <div className="course-price">
                            <span className="course-price-now">{relatedCourse.price}</span>
                            <span className="course-price-old">{relatedCourse.oldPrice}</span>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 8, justifyContent: "flex-end" }}>
                            <button
                              type="button"
                              className="course-view"
                              onClick={() => toggleWishlistCourse(relatedCourse.id)}
                              style={{ minWidth: 88 }}
                            >
                              {wishlistedCourseIds.includes(relatedCourse.id) ? "Saved ♥" : "Save ♡"}
                            </button>
                            <Link className="course-view" href={getCourseHref(relatedCourse)}>
                              View →
                            </Link>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </div>

            <aside
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-default)",
                borderRadius: "12px",
                padding: "24px",
                height: "fit-content",
                position: "sticky",
                top: "100px",
              }}
            >
              <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "20px", color: "var(--text-primary)" }}>
                This course includes:
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", gap: "12px" }}>
                  <span style={{ fontSize: "18px" }}>⏱</span>
                  <div>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600" }}>DURATION</div>
                    <div style={{ fontSize: "14px", fontWeight: "600" }}>{course.duration}</div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px" }}>
                  <span style={{ fontSize: "18px" }}>📺</span>
                  <div>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600" }}>LESSONS</div>
                    <div style={{ fontSize: "14px", fontWeight: "600" }}>{course.lessons}</div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px" }}>
                  <span style={{ fontSize: "18px" }}>📊</span>
                  <div>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600" }}>LEVEL</div>
                    <div style={{ fontSize: "14px", fontWeight: "600" }}>{course.level}</div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px" }}>
                  <span style={{ fontSize: "18px" }}>📄</span>
                  <div>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600" }}>CERTIFICATE</div>
                    <div style={{ fontSize: "14px", fontWeight: "600" }}>{course.certificate}</div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px" }}>
                  <span style={{ fontSize: "18px" }}>🌐</span>
                  <div>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600" }}>LANGUAGE</div>
                    <div style={{ fontSize: "14px", fontWeight: "600" }}>{course.language ?? "English"}</div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px" }}>
                  <span style={{ fontSize: "18px" }}>♾️</span>
                  <div>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600" }}>ACCESS</div>
                    <div style={{ fontSize: "14px", fontWeight: "600" }}>{course.access}</div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px" }}>
                  <span style={{ fontSize: "18px" }}>👨‍🏫</span>
                  <div>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600" }}>INSTRUCTOR</div>
                    <div style={{ fontSize: "14px", fontWeight: "600" }}>{course.instructorName}</div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: "24px", paddingTop: "24px", borderTop: "1px solid var(--border-default)" }}>
                <div style={{ display: "grid", gap: 10 }}>
                  <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} type="button">
                    Enroll Now
                  </button>
                  <button
                    className="btn btn-ghost"
                    style={{ width: "100%", justifyContent: "center" }}
                    type="button"
                    onClick={() => toggleWishlistCourse(course.id)}
                  >
                    {wishlistedCourseIds.includes(course.id) ? "Saved for later ♥" : "Save for later ♡"}
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}