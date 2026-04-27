export type WishlistMap = Record<string, number>;

export const WISHLIST_STORAGE_KEY = 'skillforge_wishlist_courses';
export const WISHLIST_UPDATED_EVENT = 'skillforge-wishlist-updated';

const normalizeCourseId = (courseId: string): string => courseId.trim();

export const getStoredWishlist = (): WishlistMap => {
  if (typeof window === 'undefined') return {};

  const raw = window.localStorage.getItem(WISHLIST_STORAGE_KEY);
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as WishlistMap;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    return Object.fromEntries(
      Object.entries(parsed).filter(([courseId, addedAt]) => courseId.trim() && typeof addedAt === 'number')
    );
  } catch {
    return {};
  }
};

export const getWishlistCourseIds = (): string[] => Object.keys(getStoredWishlist());

export const isCourseWishlisted = (courseId: string): boolean => {
  const normalizedCourseId = normalizeCourseId(courseId);
  if (!normalizedCourseId) return false;

  return Boolean(getStoredWishlist()[normalizedCourseId]);
};

export const toggleWishlistCourse = (courseId: string): boolean => {
  if (typeof window === 'undefined') return false;

  const normalizedCourseId = normalizeCourseId(courseId);
  if (!normalizedCourseId) return false;

  const wishlist = { ...getStoredWishlist() };
  const nextIsWishlisted = !wishlist[normalizedCourseId];

  if (nextIsWishlisted) {
    wishlist[normalizedCourseId] = Date.now();
  } else {
    delete wishlist[normalizedCourseId];
  }

  window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
  window.dispatchEvent(new Event(WISHLIST_UPDATED_EVENT));

  return nextIsWishlisted;
};

export const removeWishlistCourse = (courseId: string) => {
  if (typeof window === 'undefined') return;

  const normalizedCourseId = normalizeCourseId(courseId);
  if (!normalizedCourseId) return;

  const wishlist = { ...getStoredWishlist() };
  if (!wishlist[normalizedCourseId]) return;

  delete wishlist[normalizedCourseId];
  window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
  window.dispatchEvent(new Event(WISHLIST_UPDATED_EVENT));
};