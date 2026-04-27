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

export const getStoredOrders = (): CourseOrder[] => {
  if (typeof window === 'undefined') return [];

  const raw = window.localStorage.getItem(ORDERS_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as CourseOrder[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const getPaidOrders = (): CourseOrder[] => {
  return getStoredOrders().filter((order) => order.status === 'paid' && order.source !== 'demo');
};

export const getEnrolledCourseIds = (): string[] => {
  if (typeof window === 'undefined') return [];

  const raw = window.localStorage.getItem(ENROLLED_COURSES_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const hasPurchasedCourse = (courseId: string): boolean => {
  return getEnrolledCourseIds().includes(courseId);
};

const normalizeVideoKey = (videoUrl: string): string => videoUrl.trim();

export const getUnlockedVideoUrls = (): string[] => {
  if (typeof window === 'undefined') return [];

  const raw = window.localStorage.getItem(UNLOCKED_VIDEOS_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string' && item.trim()) : [];
  } catch {
    return [];
  }
};

export const hasPurchasedVideo = (videoUrl: string): boolean => {
  const normalized = normalizeVideoKey(videoUrl);
  if (!normalized) return false;

  return getUnlockedVideoUrls().includes(normalized);
};

export const saveUnlockedVideo = (videoUrl: string) => {
  if (typeof window === 'undefined') return;

  const normalized = normalizeVideoKey(videoUrl);
  if (!normalized) return;

  const unlocked = new Set(getUnlockedVideoUrls());
  unlocked.add(normalized);
  window.localStorage.setItem(UNLOCKED_VIDEOS_STORAGE_KEY, JSON.stringify(Array.from(unlocked)));
};

export const savePendingCheckout = (pending: PendingCheckout) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PENDING_CHECKOUT_STORAGE_KEY, JSON.stringify(pending));
};

export const getPendingCheckout = (): PendingCheckout | null => {
  if (typeof window === 'undefined') return null;

  const raw = window.localStorage.getItem(PENDING_CHECKOUT_STORAGE_KEY);
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

export const clearPendingCheckout = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(PENDING_CHECKOUT_STORAGE_KEY);
};

export const savePaidOrder = (order: CourseOrder) => {
  const prevOrders = getStoredOrders();
  window.localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify([order, ...prevOrders]));

  const enrolled = new Set(getEnrolledCourseIds());
  enrolled.add(order.courseId);
  window.localStorage.setItem(ENROLLED_COURSES_STORAGE_KEY, JSON.stringify(Array.from(enrolled)));

  if (order.videoUrl?.trim()) {
    saveUnlockedVideo(order.videoUrl);
  }

  window.dispatchEvent(new Event(PAYMENTS_UPDATED_EVENT));
  appendAdminNotification({
    type: 'payment',
    title: 'New Course Payment',
    description: `${order.buyerName} paid ${order.amount} for ${order.courseTitle}.`,
  });
};
