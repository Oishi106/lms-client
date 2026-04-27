export type CourseReview = {
  courseId: string;
  courseTitle: string;
  userName: string;
  userEmail: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: number;
  updatedAt: number;
};

export const REVIEW_STORAGE_KEY = 'skillforge_course_reviews';
export const REVIEW_UPDATED_EVENT = 'skillforge-review-updated';

const normalizeReview = (review: CourseReview): CourseReview => ({
  ...review,
  courseId: review.courseId.trim(),
  courseTitle: review.courseTitle.trim(),
  userName: review.userName.trim(),
  userEmail: review.userEmail.trim().toLowerCase(),
  rating: Math.max(1, Math.min(5, Math.round(review.rating))),
  title: review.title.trim(),
  comment: review.comment.trim(),
});

export const getStoredReviews = (): CourseReview[] => {
  if (typeof window === 'undefined') return [];

  const raw = window.localStorage.getItem(REVIEW_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as CourseReview[];
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((review) => review && typeof review === 'object')
      .map((review) => normalizeReview(review as CourseReview))
      .filter((review) => review.courseId && review.courseTitle && review.userEmail && review.comment);
  } catch {
    return [];
  }
};

export const getReviewsForCourse = (courseId: string): CourseReview[] => {
  const normalizedCourseId = courseId.trim();
  if (!normalizedCourseId) return [];

  return getStoredReviews()
    .filter((review) => review.courseId === normalizedCourseId)
    .sort((left, right) => right.updatedAt - left.updatedAt);
};

export const getReviewsByEmail = (userEmail: string): CourseReview[] => {
  const normalizedEmail = userEmail.trim().toLowerCase();
  if (!normalizedEmail) return [];

  return getStoredReviews()
    .filter((review) => review.userEmail === normalizedEmail)
    .sort((left, right) => right.updatedAt - left.updatedAt);
};

export const upsertCourseReview = (review: CourseReview): CourseReview => {
  if (typeof window === 'undefined') return normalizeReview(review);

  const normalized = normalizeReview(review);
  const stored = getStoredReviews();
  const next = [
    normalized,
    ...stored.filter(
      (item) => !(item.courseId === normalized.courseId && item.userEmail === normalized.userEmail)
    ),
  ];

  window.localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(REVIEW_UPDATED_EVENT));
  return normalized;
};

export const deleteCourseReview = (courseId: string, userEmail: string) => {
  if (typeof window === 'undefined') return;

  const normalizedCourseId = courseId.trim();
  const normalizedEmail = userEmail.trim().toLowerCase();
  if (!normalizedCourseId || !normalizedEmail) return;

  const next = getStoredReviews().filter(
    (item) => !(item.courseId === normalizedCourseId && item.userEmail === normalizedEmail)
  );

  window.localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(REVIEW_UPDATED_EVENT));
};