'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { COURSES } from '@/app/lib/courses-data';
import Navbar from '@/app/components/landing/Navbar';
import Footer from '@/app/components/landing/Footer';

type CategoryTag = 'AI & ML' | 'Development' | 'Design' | 'Data Science' | 'Cloud & DevOps' | 'Cybersecurity' | 'Mobile Dev' | 'Business';

interface Category {
  tag: CategoryTag;
  label: string;
  icon: string;
  description: string;
}

const CATEGORIES: Category[] = [
  { tag: 'AI & ML', label: 'AI & Machine Learning', icon: '🤖', description: 'Master AI and machine learning with hands-on projects' },
  { tag: 'Development', label: 'Web Development', icon: '💻', description: 'Learn front-end and back-end web development' },
  { tag: 'Design', label: 'UI/UX Design', icon: '🎨', description: 'Create beautiful and user-friendly digital experiences' },
  { tag: 'Data Science', label: 'Data Science & Analytics', icon: '📊', description: 'Analyze data and extract actionable insights' },
  { tag: 'Cloud & DevOps', label: 'Cloud & DevOps', icon: '☁️', description: 'Deploy and manage applications in the cloud' },
  { tag: 'Cybersecurity', label: 'Cybersecurity', icon: '🔒', description: 'Protect systems and networks from threats' },
  { tag: 'Mobile Dev', label: 'Mobile Development', icon: '📱', description: 'Build iOS and Android applications' },
  { tag: 'Business', label: 'Business', icon: '💼', description: 'Develop business and leadership skills' },
];

export default function CategoriesPage() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryTag | null>(null);

  const filteredCourses = useMemo(() => {
    if (!selectedCategory) return COURSES;
    return COURSES.filter((course) => course.tag === selectedCategory);
  }, [selectedCategory]);

  const selectedCategoryData = CATEGORIES.find((c) => c.tag === selectedCategory);

  return (
    <div>
      <Navbar />
      <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
        {/* Header */}
        <div
          style={{
            paddingTop: '60px',
            paddingBottom: '40px',
            textAlign: 'center',
            background: 'var(--bg-primary)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: '400px',
              height: '400px',
              background: 'radial-gradient(circle, var(--gold) 0%, transparent 70%)',
              borderRadius: '50%',
              top: '-100px',
              right: '-100px',
              opacity: 0.05,
            }}
          />
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              maxWidth: '600px',
              margin: '0 auto',
              padding: '0 20px',
            }}
          >
            <h1 style={{ fontSize: '48px', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '12px' }}>
              Explore Categories
            </h1>
            <p style={{ fontSize: '18px', color: 'var(--text-secondary)', marginBottom: '0' }}>
              Choose your learning path and master new skills
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '40px 20px',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: selectedCategory ? '300px 1fr' : '1fr',
              gap: '40px',
              transition: 'grid-template-columns 0.3s ease',
            }}
          >
            {/* Categories Grid */}
            <div>
              {selectedCategory && (
                <h2
                  style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    color: 'var(--text-primary)',
                    marginBottom: '20px',
                  }}
                >
                  Categories
                </h2>
              )}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: selectedCategory ? '1fr' : 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '16px',
                  transition: 'grid-template-columns 0.3s ease',
                }}
              >
                {CATEGORIES.map((category) => (
                  <div
                    key={category.tag}
                    onClick={() =>
                      setSelectedCategory(selectedCategory === category.tag ? null : category.tag)
                    }
                    style={{
                      cursor: 'pointer',
                      border: selectedCategory === category.tag ? '2px solid var(--gold)' : '2px solid var(--border-default)',
                      borderRadius: '16px',
                      padding: '24px 20px',
                      textAlign: 'center',
                      transition: 'all 0.3s ease',
                      background: selectedCategory === category.tag ? 'rgba(251, 146, 60, 0.05)' : 'var(--bg-surface)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-8px)';
                      e.currentTarget.style.boxShadow = '0 12px 40px rgba(251, 146, 60, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ fontSize: '48px', marginBottom: '16px', display: 'inline-block' }}>
                      {category.icon}
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
                      {category.label}
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                      {category.description}
                    </div>
                    {selectedCategory === category.tag && (
                      <div style={{ display: 'inline-block', marginTop: '12px', fontSize: '12px', background: 'rgba(251, 146, 60, 0.1)', color: 'var(--gold)', padding: '6px 12px', borderRadius: '20px', fontWeight: '600' }}>
                        {filteredCourses.length} courses
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Courses Section */}
            <div>
              {selectedCategory && (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '30px',
                    }}
                  >
                    <div>
                      <h2
                        style={{
                          fontSize: '28px',
                          fontWeight: '800',
                          color: 'var(--text-primary)',
                          marginBottom: '8px',
                        }}
                      >
                        {selectedCategoryData?.label}
                      </h2>
                      <p style={{ color: 'var(--text-secondary)', marginBottom: '0' }}>
                        {filteredCourses.length} courses available
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedCategory(null)}
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-secondary)',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--gold)';
                        e.currentTarget.style.color = 'var(--gold)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-default)';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }}
                    >
                      ✕ Clear
                    </button>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                      gap: '20px',
                    }}
                  >
                    {filteredCourses.map((course) => (
                      <Link
                        key={course.id}
                        href={`/course/${course.id}`}
                        style={{ textDecoration: 'none' }}
                      >
                        <div
                          style={{
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-default)',
                            borderRadius: '12px',
                            padding: '20px',
                            transition: 'all 0.3s ease',
                            cursor: 'pointer',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.boxShadow = '0 8px 24px rgba(251, 146, 60, 0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <div style={{ fontSize: '32px', marginBottom: '12px' }}>
                            {course.icon}
                          </div>
                          <div
                            style={{
                              fontSize: '16px',
                              fontWeight: '700',
                              color: 'var(--text-primary)',
                              marginBottom: '8px',
                              display: '-webkit-box',
                              WebkitLineClamp: '2',
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {course.title}
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              gap: '12px',
                              marginBottom: '12px',
                              flexWrap: 'wrap',
                              fontSize: '13px',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            <span>{course.tag}</span>
                            <span style={{ color: 'var(--gold)', fontWeight: '600' }}>
                              ⭐ {course.rating} ({course.reviews})
                            </span>
                          </div>
                          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                            {course.byline}
                          </div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '12px' }}>
                            <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--gold)' }}>
                              {course.price}
                            </span>
                            <span style={{ fontSize: '14px', color: 'var(--text-secondary)', textDecoration: 'line-through' }}>
                              {course.oldPrice}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {!selectedCategory && (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <div style={{ fontSize: '64px', marginBottom: '20px' }}>👈</div>
                  <h3 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
                    Select a Category
                  </h3>
                  <p>Choose a category to see all available courses</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
