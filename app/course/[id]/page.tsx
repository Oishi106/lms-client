"use client";

import Navbar from "@/app/components/landing/Navbar";
import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { useParams } from "next/navigation";
import CourseDetailsTabs from "@/app/components/course/CourseDetailsTabs";
import CoursePurchaseActions from "@/app/components/course/CoursePurchaseActions";
import CourseVideoPlayer from "@/app/components/course/CourseVideoPlayer";
import { getDefaultManagedCourses, getManagedCoursesClient, subscribeManagedCourses } from "@/app/lib/managed-courses-data";

export default function CoursePage() {
  const params = useParams<{ id: string }>();

  const coursesSnapshot = useSyncExternalStore(
    subscribeManagedCourses,
    () => JSON.stringify(getManagedCoursesClient()),
    () => JSON.stringify(getDefaultManagedCourses())
  );
  const managedCourses = useMemo(() => JSON.parse(coursesSnapshot) as ReturnType<typeof getDefaultManagedCourses>, [coursesSnapshot]);
  const course = useMemo(() => managedCourses.find((item) => item.id === params.id), [managedCourses, params.id]);

  if (!course) {
    return (
      <>
        <Navbar />
        <main className="course-details-page">
          <div className="container">
            <div style={{ padding: "60px 20px", textAlign: "center" }}>
              <h1>Course not found</h1>
              <Link href="/explore" className="btn btn-primary" style={{ marginTop: "20px" }}>
                Back to Explore
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  // Get related courses (same tag, different course)
  const relatedCourses = managedCourses.filter(
    (c) => c.tag === course.tag && c.id !== course.id
  ).slice(0, 3);

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
          {/* Hero Section */}
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
              {/* Left: Course Image */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: "300px",
                  background: "var(--bg-card)",
                  borderRadius: "16px",
                  fontSize: "120px",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                {course.icon}
              </div>

              {/* Right: Course Info & CTA */}
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
                  <span
                    style={{
                      color: "var(--gold)",
                      fontSize: "14px",
                      fontWeight: "600",
                    }}
                  >
                    {course.level}
                  </span>
                </div>

                <h1
                  style={{
                    fontSize: "36px",
                    fontWeight: "700",
                    marginBottom: "16px",
                    lineHeight: "1.2",
                  }}
                >
                  {course.title}
                </h1>

                <p
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "16px",
                    marginBottom: "24px",
                  }}
                >
                  {course.byline}
                </p>

                <div
                  style={{
                    display: "flex",
                    gap: "20px",
                    marginBottom: "32px",
                    fontSize: "14px",
                  }}
                >
                  <div>
                    <div style={{ color: "var(--text-secondary)", fontSize: "12px", marginBottom: "4px" }}>RATING</div>
                    <div style={{ fontSize: "18px", fontWeight: "600" }}>
                      ★ {course.rating} <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>({course.reviews})</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ color: "var(--text-secondary)", fontSize: "12px", marginBottom: "4px" }}>DURATION</div>
                    <div style={{ fontSize: "18px", fontWeight: "600" }}>⏱ {course.duration}</div>
                  </div>
                </div>

                {/* Price & Button */}
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    alignItems: "center",
                    marginBottom: "20px",
                  }}
                >
                  <span style={{ fontSize: "32px", fontWeight: "700", color: "var(--gold)" }}>
                    {course.price}
                  </span>
                  <span
                    style={{
                      fontSize: "16px",
                      color: "var(--text-secondary)",
                      textDecoration: "line-through",
                    }}
                  >
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

                <CoursePurchaseActions courseId={course.id} price={course.price} />

                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    marginTop: "16px",
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                  }}
                >
                  <span>✓ 42 hours of video content</span>
                  <span>✓ 282 lessons & exercises</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    marginTop: "8px",
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                  }}
                >
                  <span>✓ Module & desktop access</span>
                  <span>✓ Full lifetime access</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    marginTop: "8px",
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                  }}
                >
                  <span>✓ Verified certificate</span>
                  <span>✓ AI learning assistant</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "40px", marginBottom: "60px" }}>
            {/* Left: Course Content */}
            <div>
              <CourseVideoPlayer
                courseId={course.id}
                videoUrl={course.videoUrl}
                previewSeconds={course.previewSeconds ?? 30}
              />

              {/* Tabs */}
              <CourseDetailsTabs course={course} />

              {/* Related Courses */}
              <section>
                <h2
                  style={{
                    fontSize: "24px",
                    fontWeight: "700",
                    marginBottom: "24px",
                    color: "var(--text-primary)",
                  }}
                >
                  Related Courses
                </h2>
                <div className="course-grid-3">
                  {relatedCourses.map((c) => (
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
              </section>
            </div>

            {/* Right: Sidebar */}
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
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  marginBottom: "20px",
                  color: "var(--text-primary)",
                }}
              >
                This course includes:
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", gap: "12px" }}>
                  <span style={{ fontSize: "18px" }}>⏱</span>
                  <div>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600" }}>DURATION</div>
                    <div style={{ fontSize: "14px", fontWeight: "600" }}>{course.duration} hours</div>
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
                    <div style={{ fontSize: "14px", fontWeight: "600" }}>{course.language}</div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px" }}>
                  <span style={{ fontSize: "18px" }}>♾️</span>
                  <div>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600" }}>ACCESS</div>
                    <div style={{ fontSize: "14px", fontWeight: "600" }}>{course.access}</div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: "24px", paddingTop: "24px", borderTop: "1px solid var(--border-default)" }}>
                <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} type="button">
                  Enroll Now
                </button>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
