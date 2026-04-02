'use client';

import { useState } from 'react';
import type { Course } from '@/app/lib/courses-data';

interface CourseDetailsTabsProps {
  course: Course;
}

export default function CourseDetailsTabs({ course }: CourseDetailsTabsProps) {
  const [activeTab, setActiveTab] = useState('overview');

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
                      42 hours
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
                      282 lectures
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '8px', fontWeight: '600' }}>
                      LANGUAGE
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      English
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
                    ★ ({course.reviews} reviews)
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
                Student Reviews
              </h3>
              {[1, 2, 3].map((review) => (
                <div
                  key={review}
                  style={{
                    padding: '20px',
                    borderBottom: '1px solid var(--border-subtle)',
                    marginBottom: '20px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>John Doe</div>
                    <div style={{ color: 'var(--gold)' }}>★★★★★</div>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
                    This course is excellent! The instructor explains everything clearly and the materials are very well structured. I learned a lot from this course and would highly recommend it to anyone.
                  </p>
                </div>
              ))}
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
                  fontSize: '60px',
                  flexShrink: 0,
                }}
              >
                👨‍🏫
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
                  Dr. Sarah Chen
                </h3>
                <p
                  style={{
                    color: 'var(--gold)',
                    fontSize: '14px',
                    fontWeight: '600',
                    marginBottom: '16px',
                  }}
                >
                  Machine Learning Expert & Data Scientist
                </p>
                <p
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: '15px',
                    lineHeight: '1.8',
                    marginBottom: '24px',
                  }}
                >
                  Dr. Sarah Chen is a renowned machine learning expert with over 15 years of experience in the tech industry. She has led numerous projects at top tech companies and is passionate about teaching complex concepts in an easy-to-understand manner.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '8px', fontWeight: '600' }}>
                      COURSES
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      12 courses
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '8px', fontWeight: '600' }}>
                      STUDENTS
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      45.2K students
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
