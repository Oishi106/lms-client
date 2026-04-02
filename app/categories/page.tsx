'use client';

import Link from 'next/link';
import { useMemo, useState, useSyncExternalStore } from 'react';
import { COURSES } from '@/app/lib/courses-data';
import Navbar from '@/app/components/landing/Navbar';
import Footer from '@/app/components/landing/Footer';
import { CATEGORIES_STORAGE_KEY, DEFAULT_CATEGORIES, type CategoryItem } from '@/app/lib/categories-data';

type CourseTag = (typeof COURSES)[number]['tag'];

interface Category {
  id: string;
  tag: string;
  label: string;
  icon: string;
  description: string;
}

const DEFAULT_CATEGORIES_SNAPSHOT = JSON.stringify(DEFAULT_CATEGORIES);

const CATEGORY_META: Record<string, { tag: CourseTag; description: string }> = {
  'AI & Machine Learning': { tag: 'AI & ML', description: 'Master AI and machine learning with hands-on projects' },
  'Web Development': { tag: 'Development', description: 'Learn front-end and back-end web development' },
  'UI/UX Design': { tag: 'Design', description: 'Create beautiful and user-friendly digital experiences' },
  'Data & Analytics': { tag: 'Data Science', description: 'Analyze data and extract actionable insights' },
  'Cloud & DevOps': { tag: 'Cloud & DevOps', description: 'Deploy and manage applications in the cloud' },
  'Cyber Security': { tag: 'Cybersecurity', description: 'Protect systems and networks from threats' },
  'Mobile Development': { tag: 'Mobile Dev', description: 'Build iOS and Android applications' },
  Business: { tag: 'Business', description: 'Develop business and leadership skills' },
};

const normalizeCategories = (items: CategoryItem[]): CategoryItem[] => {
  if (!Array.isArray(items) || items.length === 0) return DEFAULT_CATEGORIES;
  const normalized = items
    .map((item, index) => ({
      id: item.id?.trim() || `category-${index + 1}`,
      label: item.label?.trim() || '',
      icon: item.icon?.trim() || '📚',
      pill: item.pill,
    }))
    .filter((item) => item.label);
  return normalized.length > 0 ? normalized : DEFAULT_CATEGORIES;
};

const getClientSnapshot = (): string => {
  const storedCategories = window.localStorage.getItem(CATEGORIES_STORAGE_KEY);
  if (!storedCategories) return DEFAULT_CATEGORIES_SNAPSHOT;
  try {
    return JSON.stringify(normalizeCategories(JSON.parse(storedCategories) as CategoryItem[]));
  } catch {
    return DEFAULT_CATEGORIES_SNAPSHOT;
  }
};

const subscribeCategories = (callback: () => void) => {
  const onStorage = (event: StorageEvent) => {
    if (event.key === CATEGORIES_STORAGE_KEY) callback();
  };
  const onLocalUpdate = () => callback();

  window.addEventListener('storage', onStorage);
  window.addEventListener('skillforge-categories-updated', onLocalUpdate);

  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener('skillforge-categories-updated', onLocalUpdate);
  };
};

export default function CategoriesPage() {
  const categoriesSnapshot = useSyncExternalStore(subscribeCategories, getClientSnapshot, () => DEFAULT_CATEGORIES_SNAPSHOT);
  const baseCategories = useMemo(() => JSON.parse(categoriesSnapshot) as CategoryItem[], [categoriesSnapshot]);

  const categories = useMemo<Category[]>(() => {
    return baseCategories.map((category) => {
      const meta = CATEGORY_META[category.label] ?? {
        tag: 'Development' as CourseTag,
        description: 'Explore curated courses in this category.',
      };
      return {
        id: category.id,
        label: category.label,
        icon: category.icon,
        tag: meta.tag,
        description: meta.description,
      };
    });
  }, [baseCategories]);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const filteredCourses = useMemo(() => {
    if (!selectedCategoryId) return COURSES;
    const selectedCategory = categories.find((category) => category.id === selectedCategoryId);
    if (!selectedCategory) return [];
    return COURSES.filter((course) => course.tag === selectedCategory.tag);
  }, [selectedCategoryId, categories]);

  const selectedCategoryData = categories.find((category) => category.id === selectedCategoryId);

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
              gridTemplateColumns: selectedCategoryId ? '300px 1fr' : '1fr',
              gap: '40px',
              transition: 'grid-template-columns 0.3s ease',
            }}
          >
            {/* Categories Grid */}
            <div>
              {selectedCategoryId && (
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
                  gridTemplateColumns: selectedCategoryId ? '1fr' : 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '16px',
                  transition: 'grid-template-columns 0.3s ease',
                }}
              >
                {categories.map((category) => (
                  <div
                    key={category.id}
                    onClick={() =>
                      setSelectedCategoryId(selectedCategoryId === category.id ? null : category.id)
                    }
                    style={{
                      cursor: 'pointer',
                      border: selectedCategoryId === category.id ? '2px solid var(--gold)' : '2px solid var(--border-default)',
                      borderRadius: '16px',
                      padding: '24px 20px',
                      textAlign: 'center',
                      transition: 'all 0.3s ease',
                      background: selectedCategoryId === category.id ? 'rgba(251, 146, 60, 0.05)' : 'var(--bg-surface)',
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
                    {selectedCategoryId === category.id && (
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
              {selectedCategoryId && (
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
                      onClick={() => setSelectedCategoryId(null)}
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

              {!selectedCategoryId && (
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
