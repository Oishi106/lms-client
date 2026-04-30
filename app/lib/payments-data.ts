export interface CourseOrder {
  id: string;
  courseId: string;
  courseTitle: string;
  amount: string;
  buyerName: string;
  buyerEmail: string;
  videoUrl?: string;
  createdAt: number;
  status: 'paid';
  source?: 'real' | 'demo';
}

import { appendAdminNotification } from '@/app/lib/admin-notifications';

export const ORDERS_STORAGE_KEY = 'skillforge_course_orders';
export const ENROLLED_COURSES_STORAGE_KEY = 'skillforge_enrolled_courses';
export const UNLOCKED_VIDEOS_STORAGE_KEY = 'skillforge_unlocked_videos';
export const PENDING_CHECKOUT_STORAGE_KEY = 'skillforge_pending_checkout';
export const PAYMENTS_UPDATED_EVENT = 'skillforge-payments-updated';

export type PendingCheckout = {
  courseId: string;
  courseTitle: string;
  amount: string;
  buyerName: string;
  buyerEmail: string;
  videoUrl?: string;
  createdAt: number;
};

const normalizeEmail = (email?: string): string => email?.trim().toLowerCase() || '';
const getScopedKey = (baseKey: string, userEmail?: string): string => {
  const normalizedEmail = normalizeEmail(userEmail);
  return normalizedEmail ? `${baseKey}:${normalizedEmail}` : baseKey;
};

export const getStoredOrders = (userEmail?: string): CourseOrder[] => {
  if (typeof window === 'undefined') return [];

  const raw = window.localStorage.getItem(getScopedKey(ORDERS_STORAGE_KEY, userEmail));
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as CourseOrder[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const getPaidOrders = (userEmail?: string): CourseOrder[] => {
  return getStoredOrders(userEmail).filter((order) => order.status === 'paid' && order.source !== 'demo');
};

export const getEnrolledCourseIds = (userEmail?: string): string[] => {
  if (typeof window === 'undefined') return [];

  const raw = window.localStorage.getItem(getScopedKey(ENROLLED_COURSES_STORAGE_KEY, userEmail));
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const hasPurchasedCourse = (courseId: string, userEmail?: string): boolean => {
  return getEnrolledCourseIds(userEmail).includes(courseId);
};

const normalizeVideoKey = (videoUrl: string): string => videoUrl.trim();

export const getUnlockedVideoUrls = (userEmail?: string): string[] => {
  if (typeof window === 'undefined') return [];

  const raw = window.localStorage.getItem(getScopedKey(UNLOCKED_VIDEOS_STORAGE_KEY, userEmail));
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string' && item.trim()) : [];
  } catch {
    return [];
  }
};

export const hasPurchasedVideo = (videoUrl: string, userEmail?: string): boolean => {
  const normalized = normalizeVideoKey(videoUrl);
  if (!normalized) return false;

  return getUnlockedVideoUrls(userEmail).includes(normalized);
};

export const saveUnlockedVideo = (videoUrl: string, userEmail?: string) => {
  if (typeof window === 'undefined') return;

  const normalized = normalizeVideoKey(videoUrl);
  if (!normalized) return;

  const unlocked = new Set(getUnlockedVideoUrls(userEmail));
  unlocked.add(normalized);
  window.localStorage.setItem(getScopedKey(UNLOCKED_VIDEOS_STORAGE_KEY, userEmail), JSON.stringify(Array.from(unlocked)));
};

export const savePendingCheckout = (pending: PendingCheckout, userEmail?: string) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(getScopedKey(PENDING_CHECKOUT_STORAGE_KEY, userEmail), JSON.stringify(pending));
};

export const getPendingCheckout = (userEmail?: string): PendingCheckout | null => {
  if (typeof window === 'undefined') return null;

  const raw = window.localStorage.getItem(getScopedKey(PENDING_CHECKOUT_STORAGE_KEY, userEmail));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as PendingCheckout;
    if (!parsed || typeof parsed !== 'object') return null;
    if (!parsed.courseId || !parsed.courseTitle || !parsed.amount) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const clearPendingCheckout = (userEmail?: string) => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(getScopedKey(PENDING_CHECKOUT_STORAGE_KEY, userEmail));
};

export const savePaidOrder = (order: CourseOrder, userEmail?: string) => {
  const normalizedEmail = normalizeEmail(userEmail || order.buyerEmail);
  const prevOrders = getStoredOrders(normalizedEmail);
  window.localStorage.setItem(getScopedKey(ORDERS_STORAGE_KEY, normalizedEmail), JSON.stringify([order, ...prevOrders]));

  const enrolled = new Set(getEnrolledCourseIds(normalizedEmail));
  enrolled.add(order.courseId);
  window.localStorage.setItem(getScopedKey(ENROLLED_COURSES_STORAGE_KEY, normalizedEmail), JSON.stringify(Array.from(enrolled)));

  if (order.videoUrl?.trim()) {
    saveUnlockedVideo(order.videoUrl, normalizedEmail);
  }

  window.dispatchEvent(new Event(PAYMENTS_UPDATED_EVENT));
  appendAdminNotification({
    type: 'payment',
    title: 'New Course Payment',
    description: `${order.buyerName} paid ${order.amount} for ${order.courseTitle}.`,
  });
};
