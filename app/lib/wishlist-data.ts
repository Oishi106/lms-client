export type WishlistMap = Record<string, number>;

export const WISHLIST_STORAGE_KEY = 'skillforge_wishlist_courses';
export const WISHLIST_UPDATED_EVENT = 'skillforge-wishlist-updated';

const normalizeCourseId = (courseId: string): string => courseId.trim();
const normalizeEmail = (email?: string): string => email?.trim().toLowerCase() || '';
const getScopedKey = (baseKey: string, userEmail?: string): string => {
  const normalizedEmail = normalizeEmail(userEmail);
  return normalizedEmail ? `${baseKey}:${normalizedEmail}` : baseKey;
};

export const getStoredWishlist = (userEmail?: string): WishlistMap => {
  if (typeof window === 'undefined') return {};

  const raw = window.localStorage.getItem(getScopedKey(WISHLIST_STORAGE_KEY, userEmail));
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

export const getWishlistCourseIds = (userEmail?: string): string[] => Object.keys(getStoredWishlist(userEmail));

export const isCourseWishlisted = (courseId: string, userEmail?: string): boolean => {
  const normalizedCourseId = normalizeCourseId(courseId);
  if (!normalizedCourseId) return false;

  return Boolean(getStoredWishlist(userEmail)[normalizedCourseId]);
};

export const toggleWishlistCourse = (courseId: string, userEmail?: string): boolean => {
  if (typeof window === 'undefined') return false;

  const normalizedCourseId = normalizeCourseId(courseId);
  if (!normalizedCourseId) return false;

  const wishlist = { ...getStoredWishlist(userEmail) };
  const nextIsWishlisted = !wishlist[normalizedCourseId];

  if (nextIsWishlisted) {
    wishlist[normalizedCourseId] = Date.now();
  } else {
    delete wishlist[normalizedCourseId];
  }

  window.localStorage.setItem(getScopedKey(WISHLIST_STORAGE_KEY, userEmail), JSON.stringify(wishlist));
  window.dispatchEvent(new Event(WISHLIST_UPDATED_EVENT));

  return nextIsWishlisted;
};

export const removeWishlistCourse = (courseId: string, userEmail?: string) => {
  if (typeof window === 'undefined') return;

  const normalizedCourseId = normalizeCourseId(courseId);
  if (!normalizedCourseId) return;

  const wishlist = { ...getStoredWishlist(userEmail) };
  if (!wishlist[normalizedCourseId]) return;

  delete wishlist[normalizedCourseId];
  window.localStorage.setItem(getScopedKey(WISHLIST_STORAGE_KEY, userEmail), JSON.stringify(wishlist));
  window.dispatchEvent(new Event(WISHLIST_UPDATED_EVENT));
};