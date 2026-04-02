export interface CourseOrder {
  id: string;
  courseId: string;
  courseTitle: string;
  amount: string;
  buyerName: string;
  buyerEmail: string;
  createdAt: number;
  status: 'paid';
}

import { appendAdminNotification } from '@/app/lib/admin-notifications';

export const ORDERS_STORAGE_KEY = 'skillforge_course_orders';
export const ENROLLED_COURSES_STORAGE_KEY = 'skillforge_enrolled_courses';
export const PAYMENTS_UPDATED_EVENT = 'skillforge-payments-updated';

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

export const savePaidOrder = (order: CourseOrder) => {
  const prevOrders = getStoredOrders();
  window.localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify([order, ...prevOrders]));

  const enrolled = new Set(getEnrolledCourseIds());
  enrolled.add(order.courseId);
  window.localStorage.setItem(ENROLLED_COURSES_STORAGE_KEY, JSON.stringify(Array.from(enrolled)));
  window.dispatchEvent(new Event(PAYMENTS_UPDATED_EVENT));
  appendAdminNotification({
    type: 'payment',
    title: 'New Course Payment',
    description: `${order.buyerName} paid ${order.amount} for ${order.courseTitle}.`,
  });
};
