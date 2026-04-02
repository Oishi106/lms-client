export type CourseVideoMap = Record<string, string>;

export const COURSE_VIDEO_STORAGE_KEY = 'skillforge_course_video_overrides';
export const COURSE_VIDEO_UPDATED_EVENT = 'skillforge-course-video-updated';

export const getStoredCourseVideoMap = (): CourseVideoMap => {
  if (typeof window === 'undefined') return {};

  const raw = window.localStorage.getItem(COURSE_VIDEO_STORAGE_KEY);
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as CourseVideoMap;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return parsed;
  } catch {
    return {};
  }
};

export const saveCourseVideoMap = (map: CourseVideoMap) => {
  window.localStorage.setItem(COURSE_VIDEO_STORAGE_KEY, JSON.stringify(map));
  window.dispatchEvent(new Event(COURSE_VIDEO_UPDATED_EVENT));
};

export const resetCourseVideoMap = () => {
  window.localStorage.removeItem(COURSE_VIDEO_STORAGE_KEY);
  window.dispatchEvent(new Event(COURSE_VIDEO_UPDATED_EVENT));
};
