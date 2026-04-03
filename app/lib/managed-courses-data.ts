import { COURSES, type Course } from '@/app/lib/courses-data';

export const MANAGED_COURSES_STORAGE_KEY = 'skillforge_managed_courses';
export const MANAGED_COURSES_UPDATED_EVENT = 'skillforge-managed-courses-updated';

const LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'] as const;
const ACCENTS = ['violet', 'teal', 'rose', 'green', 'gold'] as const;

const slugify = (text: string): string =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-') || `course-${Date.now()}`;

const sanitizeCourse = (item: Partial<Course>, index: number): Course => {
  const fallback = COURSES[index % COURSES.length] ?? COURSES[0];
  const title = item.title?.trim() || fallback.title || `Untitled Course ${index + 1}`;
  const id = item.id?.trim() || slugify(title);
  const level: Course['level'] = LEVELS.includes(item.level as (typeof LEVELS)[number]) ? (item.level as Course['level']) : fallback.level;
  const accent: Course['accent'] = ACCENTS.includes(item.accent as (typeof ACCENTS)[number]) ? (item.accent as Course['accent']) : fallback.accent;

  return {
    id,
    level,
    accent,
    icon: item.icon?.trim() || fallback.icon || '📘',
    tag: item.tag?.trim() || fallback.tag || 'Development',
    rating: item.rating?.trim() || fallback.rating || '4.5',
    reviews: item.reviews?.trim() || fallback.reviews || '1.0k',
    title,
    byline: item.byline?.trim() || fallback.byline || 'by SkillForge Instructor',
    duration: item.duration?.trim() || fallback.duration || '12h',
    price: item.price?.trim() || fallback.price || '$49',
    oldPrice: item.oldPrice?.trim() || fallback.oldPrice || '$99',
    lessons: item.lessons?.trim() || fallback.lessons,
    instructor: item.instructor?.trim() || fallback.instructor,
    certificate: item.certificate?.trim() || fallback.certificate,
    language: item.language?.trim() || fallback.language,
    access: item.access?.trim() || fallback.access,
    description: item.description?.trim() || fallback.description,
    learnings: Array.isArray(item.learnings) ? item.learnings : fallback.learnings,
    relatedCourses: Array.isArray(item.relatedCourses) ? item.relatedCourses : fallback.relatedCourses,
    videoUrl: item.videoUrl?.trim() || fallback.videoUrl,
    previewSeconds:
      typeof item.previewSeconds === 'number' && item.previewSeconds > 0
        ? Math.max(item.previewSeconds, 300)
        : Math.max(fallback.previewSeconds ?? 300, 300),
  };
};

export const getDefaultManagedCourses = (): Course[] => COURSES;

export const getManagedCoursesClient = (): Course[] => {
  if (typeof window === 'undefined') return getDefaultManagedCourses();

  const raw = window.localStorage.getItem(MANAGED_COURSES_STORAGE_KEY);
  if (!raw) return getDefaultManagedCourses();

  try {
    const parsed = JSON.parse(raw) as Partial<Course>[];
    if (!Array.isArray(parsed) || parsed.length === 0) return getDefaultManagedCourses();
    const normalized = parsed.map((item, index) => sanitizeCourse(item, index));
    return normalized.length > 0 ? normalized : getDefaultManagedCourses();
  } catch {
    return getDefaultManagedCourses();
  }
};

export const saveManagedCourses = (courses: Partial<Course>[]): Course[] => {
  const normalized = courses.map((item, index) => sanitizeCourse(item, index));
  window.localStorage.setItem(MANAGED_COURSES_STORAGE_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new Event(MANAGED_COURSES_UPDATED_EVENT));
  return normalized;
};

export const resetManagedCourses = () => {
  window.localStorage.removeItem(MANAGED_COURSES_STORAGE_KEY);
  window.dispatchEvent(new Event(MANAGED_COURSES_UPDATED_EVENT));
};

export const subscribeManagedCourses = (callback: () => void) => {
  const onStorage = (event: StorageEvent) => {
    if (event.key === MANAGED_COURSES_STORAGE_KEY) callback();
  };

  window.addEventListener('storage', onStorage);
  window.addEventListener(MANAGED_COURSES_UPDATED_EVENT, callback);

  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(MANAGED_COURSES_UPDATED_EVENT, callback);
  };
};
