'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import type { CatalogCourse } from '@/app/lib/course-catalog';
import {
  type CourseReview,
  getReviewsForCourse,
  upsertCourseReview,
} from '@/app/lib/review-data';

interface CourseDetailsTabsProps {
  course: CatalogCourse;
}

function ReviewComposer({
  course,
  currentUserEmail,
  currentUserName,
  currentUserReview,
  isAdmin,
  onSaved,
}: {
  course: CatalogCourse;
  currentUserEmail: string;
  currentUserName: string;
  currentUserReview: CourseReview | null;
  isAdmin: boolean;
  onSaved: () => void;
}) {
  const [reviewRating, setReviewRating] = useState(currentUserReview?.rating ?? 5);
  const [reviewTitle, setReviewTitle] = useState(currentUserReview?.title ?? '');
  const [reviewComment, setReviewComment] = useState(currentUserReview?.comment ?? '');
  const [reviewStatus, setReviewStatus] = useState('');

  if (isAdmin) {
    return (
      <div
        style={{
          padding: '18px',
          border: '1px solid var(--border-default)',
          borderRadius: '12px',
          color: 'var(--text-secondary)',
          marginBottom: '24px',
          background: 'var(--bg-card)',
        }}
      >
        Admin accounts can read all course reviews but cannot post reviews.
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '20px',
        border: '1px solid var(--border-default)',
        borderRadius: '14px',
        background: 'var(--bg-card)',
        marginBottom: '24px',
      }}
    >
      <div style={{ display: 'grid', gap: '14px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[5, 4, 3, 2, 1].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setReviewRating(star)}
              style={{
                border: '1px solid var(--border-default)',
                borderRadius: '999px',
                padding: '8px 12px',
                background: reviewRating === star ? 'var(--gold-dim)' : 'transparent',
                color: reviewRating === star ? 'var(--gold)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: 700,
              }}
            >
              {star}★
            </button>
          ))}
        </div>

        <input
          className="input-field"
          value={reviewTitle}
          onChange={(event) => setReviewTitle(event.target.value)}
          placeholder="Review title"
        />

        <textarea
          className="input-field"
          value={reviewComment}
          onChange={(event) => setReviewComment(event.target.value)}
          rows={4}
          placeholder="Share what you learned and how the course helped you..."
        />

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              if (!reviewComment.trim()) {
                setReviewStatus('Please write a review comment.');
                return;
              }

              upsertCourseReview({
                courseId: course.id,
                courseTitle: course.title,
                userName: currentUserName,
                userEmail: currentUserEmail,
                rating: reviewRating,
                title: reviewTitle || `${course.title} review`,
                comment: reviewComment,
                createdAt: currentUserReview?.createdAt ?? Date.now(),
                updatedAt: Date.now(),
              });

              setReviewStatus('Review saved successfully.');
              onSaved();
            }}
          >
            {currentUserReview ? 'Update Review' : 'Submit Review'}
          </button>

        </div>

        {reviewStatus ? (
          <div style={{ color: 'var(--teal)', fontSize: '13px' }}>{reviewStatus}</div>
        ) : null}
      </div>
    </div>
  );
}

export default function CourseDetailsTabs({ course }: CourseDetailsTabsProps) {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('overview');
  const [reviewRevision, setReviewRevision] = useState(0);

  const currentUserEmail = session?.user?.email?.trim().toLowerCase() ?? '';
  const currentUserName = session?.user?.name?.trim() || 'Learner';
  const isAdmin = session?.user?.role === 'admin';
  const currentUserReview = currentUserEmail
    ? getReviewsForCourse(course.id).find((item) => item.userEmail === currentUserEmail) ?? null
    : null;
  const courseReviews = getReviewsForCourse(course.id);

  useEffect(() => {
    const syncReviews = () => setReviewRevision((value) => value + 1);
    const onStorage = (event: StorageEvent) => {
      if (event.key === undefined) syncReviews();
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('skillforge-review-updated', syncReviews);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('skillforge-review-updated', syncReviews);
    };
  }, []);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'curriculum', label: 'Curriculum' },
    { id: 'reviews', label: `Reviews (${course.reviews})` },
    { id: 'instructor', label: 'Instructor' },
  ];

  return (
    <div>
      {/* Tab Navigation */}
      <div
        style={{
          display: 'flex',
          gap: '0',
          borderBottom: '1px solid var(--border-default)',
          marginBottom: '40px',
          overflow: 'auto',
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '16px 24px',
              fontSize: '16px',
              fontWeight: activeTab === tab.id ? '600' : '500',
              color:
                activeTab === tab.id
                  ? 'var(--gold)'
                  : 'var(--text-secondary)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              transition: 'color 0.2s ease',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '-1px',
                  left: '0',
                  right: '0',
                  height: '3px',
                  background: 'var(--gold)',
                  borderRadius: '2px 2px 0 0',
                }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <section>
            <div
              style={{
                marginBottom: '40px',
              }}
            >
              <h3
                style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  marginBottom: '16px',
                  color: 'var(--text-primary)',
                }}
              >
                About This Course
              </h3>
              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '15px',
                  lineHeight: '1.8',
                }}
              >
                {course.description}
              </p>
            </div>

            <div
              style={{
                marginBottom: '40px',
              }}
            >
              <h3
                style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  marginBottom: '16px',
                  color: 'var(--text-primary)',
                }}
              >
                What You&apos;ll Learn
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {course.learnings?.map((learning: string, idx: number) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      padding: '12px',
                      background: 'var(--bg-card)',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <span style={{ color: 'var(--gold)', fontSize: '18px', flexShrink: 0 }}>✓</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                      {learning}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3
                style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  marginBottom: '16px',
                  color: 'var(--text-primary)',
                }}
              >
                Course Details
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                <div>
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '8px', fontWeight: '600' }}>
                      DURATION
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {course.duration}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '8px', fontWeight: '600' }}>
                      LEVEL
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {course.level}
                    </div>
                  </div>
                </div>
                <div>
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '8px', fontWeight: '600' }}>
                      LESSONS
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {course.lessons}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '8px', fontWeight: '600' }}>
                      LANGUAGE
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {course.language ?? 'English'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Curriculum Tab */}
        {activeTab === 'curriculum' && (
          <section>
            <div
              style={{
                border: '1px solid var(--border-default)',
                borderRadius: '12px',
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '20px', background: 'var(--bg-card)' }}>
                <h3 style={{ fontWeight: '600', marginBottom: '12px', color: 'var(--text-primary)' }}>
                  Module 1: Introduction & Fundamentals
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>57 lessons · 6 hours</p>
              </div>
              <div
                style={{
                  padding: '20px',
                  background: 'var(--bg-surface)',
                  borderTop: '1px solid var(--border-default)',
                }}
              >
                <h3 style={{ fontWeight: '600', marginBottom: '12px', color: 'var(--text-primary)' }}>
                  Module 2: Core Concepts
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>68 lessons · 8 hours</p>
              </div>
              <div
                style={{
                  padding: '20px',
                  background: 'var(--bg-card)',
                  borderTop: '1px solid var(--border-default)',
                }}
              >
                <h3 style={{ fontWeight: '600', marginBottom: '12px', color: 'var(--text-primary)' }}>
                  Module 3: Advanced Techniques
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>94 lessons · 12 hours</p>
              </div>
              <div
                style={{
                  padding: '20px',
                  background: 'var(--bg-surface)',
                  borderTop: '1px solid var(--border-default)',
                }}
              >
                <h3 style={{ fontWeight: '600', marginBottom: '12px', color: 'var(--text-primary)' }}>
                  Module 4: Projects & Capstone
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>63 lessons · 10 hours</p>
              </div>
            </div>
          </section>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <section>
            <div style={{ marginBottom: '30px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '40px' }}>
                <div>
                  <div style={{ fontSize: '48px', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {course.rating}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                    ★ ({course.totalReviews.toLocaleString()} reviews)
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  {[5, 4, 3, 2, 1].map((star) => (
                    <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '500' }}>{star}★</span>
                      <div
                        style={{
                          flex: 1,
                          height: '8px',
                          background: 'var(--bg-card)',
                          borderRadius: '4px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            background: 'var(--gold)',
                            width: `${(6 - star) * 15}%`,
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', width: '40px' }}>
                        {(6 - star) * 15}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: '30px' }}>
              <h3
                style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  marginBottom: '24px',
                  color: 'var(--text-primary)',
                }}
              >
                Write a Review
              </h3>
              {!currentUserEmail ? (
                <div
                  style={{
                    padding: '18px',
                    border: '1px solid var(--border-default)',
                    borderRadius: '12px',
                    color: 'var(--text-secondary)',
                    marginBottom: '24px',
                  }}
                >
                  Sign in to leave a review for this course.
                </div>
              ) : (
                <ReviewComposer
                  key={`${currentUserReview?.updatedAt ?? 'new'}-${reviewRevision}`}
                  course={course}
                  currentUserEmail={currentUserEmail}
                  currentUserName={currentUserName}
                  currentUserReview={currentUserReview}
                  isAdmin={isAdmin}
                  onSaved={() => setReviewRevision((value) => value + 1)}
                />
              )}

              <h3
                style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  marginBottom: '24px',
                  color: 'var(--text-primary)',
                }}
              >
                Student Reviews
              </h3>
              {courseReviews.length === 0 ? (
                <div style={{ padding: '18px', color: 'var(--text-secondary)', border: '1px solid var(--border-default)', borderRadius: '12px' }}>
                  No reviews yet. Be the first to share your thoughts.
                </div>
              ) : (
                courseReviews.map((review) => (
                  <div
                    key={`${review.courseId}-${review.userEmail}`}
                    style={{
                      padding: '20px',
                      borderBottom: '1px solid var(--border-subtle)',
                      marginBottom: '20px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', gap: '12px' }}>
                      <div>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{review.userName}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{new Date(review.updatedAt).toLocaleDateString()}</div>
                      </div>
                      <div style={{ color: 'var(--gold)', whiteSpace: 'nowrap' }}>{'★'.repeat(review.rating)}</div>
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>{review.title}</div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                      {review.comment}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* Instructor Tab */}
        {activeTab === 'instructor' && (
          <section>
            <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
              <div
                style={{
                  width: '150px',
                  height: '150px',
                  borderRadius: '12px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  flexShrink: 0,
                  position: 'relative',
                }}
              >
                {course.instructorAvatar ? (
                  <div
                    aria-label={course.instructorName || 'Instructor'}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      backgroundImage: `url(${course.instructorAvatar})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '48px',
                      fontWeight: '700',
                      color: 'var(--gold)',
                      background: 'var(--bg-card)',
                    }}
                  >
                    {(course.instructorName?.trim()?.[0] || 'I').toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <h3
                  style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    marginBottom: '8px',
                    color: 'var(--text-primary)',
                  }}
                >
                  {course.instructorName || 'SkillForge Instructor'}
                </h3>
                <p
                  style={{
                    color: 'var(--gold)',
                    fontSize: '14px',
                    fontWeight: '600',
                    marginBottom: '16px',
                  }}
                >
                  {course.instructorRole || 'Course Instructor'}
                </p>
                <p
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: '15px',
                    lineHeight: '1.8',
                    marginBottom: '24px',
                  }}
                >
                  {course.instructorName || 'This instructor'} teaches {course.tag} courses using the live catalog data for this course.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '8px', fontWeight: '600' }}>
                      REVIEWS
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {course.totalReviews.toLocaleString()} reviews
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '8px', fontWeight: '600' }}>
                      LESSONS
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {course.lessons}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
