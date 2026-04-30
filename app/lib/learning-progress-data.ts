export type LearningProgressMap = Record<string, number>;

export const LEARNING_PROGRESS_STORAGE_KEY = 'skillforge_learning_progress';
export const LEARNING_PROGRESS_UPDATED_EVENT = 'skillforge-learning-progress-updated';
const normalizeEmail = (email?: string): string => email?.trim().toLowerCase() || '';
const getScopedKey = (baseKey: string, userEmail?: string): string => {
  const normalizedEmail = normalizeEmail(userEmail);
  return normalizedEmail ? `${baseKey}:${normalizedEmail}` : baseKey;
};

const normalizeProgress = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
};

export const getStoredLearningProgress = (userEmail?: string): LearningProgressMap => {
  if (typeof window === 'undefined') return {};

  const raw = window.localStorage.getItem(getScopedKey(LEARNING_PROGRESS_STORAGE_KEY, userEmail));
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as LearningProgressMap;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    return Object.fromEntries(
      Object.entries(parsed).filter(([courseId, progress]) => courseId.trim() && typeof progress === 'number')
    );
  } catch {
    return {};
  }
};

export const getCourseLearningProgress = (courseId: string, userEmail?: string): number => {
  const normalizedCourseId = courseId.trim();
  if (!normalizedCourseId) return 0;

  return normalizeProgress(getStoredLearningProgress(userEmail)[normalizedCourseId] ?? 0);
};

export const saveCourseLearningProgress = (courseId: string, progress: number, userEmail?: string) => {
  if (typeof window === 'undefined') return;

  const normalizedCourseId = courseId.trim();
  if (!normalizedCourseId) return;

  const next = {
    ...getStoredLearningProgress(userEmail),
    [normalizedCourseId]: normalizeProgress(progress),
  };

  window.localStorage.setItem(getScopedKey(LEARNING_PROGRESS_STORAGE_KEY, userEmail), JSON.stringify(next));
  window.dispatchEvent(new Event(LEARNING_PROGRESS_UPDATED_EVENT));
};

export const clearCourseLearningProgress = (courseId: string, userEmail?: string) => {
  if (typeof window === 'undefined') return;

  const normalizedCourseId = courseId.trim();
  if (!normalizedCourseId) return;

  const next = { ...getStoredLearningProgress(userEmail) };
  delete next[normalizedCourseId];

  window.localStorage.setItem(getScopedKey(LEARNING_PROGRESS_STORAGE_KEY, userEmail), JSON.stringify(next));
  window.dispatchEvent(new Event(LEARNING_PROGRESS_UPDATED_EVENT));
};