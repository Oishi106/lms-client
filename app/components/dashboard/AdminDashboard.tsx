'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { type Course } from '@/app/lib/courses-data';
import { DEFAULT_FAQS, FAQ_STORAGE_KEY, type FaqItem } from '@/app/lib/faq-data';
import { DEFAULT_HERO_IMAGE_URL, HERO_IMAGE_STORAGE_KEY } from '@/app/lib/hero-data';
import { CATEGORIES_STORAGE_KEY, DEFAULT_CATEGORIES, type CategoryItem } from '@/app/lib/categories-data';
import { getInitialUserAdminChat, saveUserAdminChat, subscribeUserAdminChat, type UserAdminChatMessage } from '@/app/lib/user-admin-chat';
import { getDefaultManagedCourses, getManagedCoursesClient, resetManagedCourses, saveManagedCourses } from '@/app/lib/managed-courses-data';
import { clearAllAdminNotifications, deleteAdminNotification, getAdminNotifications, markAllAdminNotificationsRead, subscribeAdminNotifications, appendAdminNotification, type AdminNotification } from '@/app/lib/admin-notifications';
import { appendUserNotification } from '@/app/lib/user-notifications';
import { PAYMENTS_UPDATED_EVENT, getPaidOrders, type CourseOrder } from '@/app/lib/payments-data';
import { REVIEW_STORAGE_KEY, REVIEW_UPDATED_EVENT, getStoredReviews } from '@/app/lib/review-data';

type AdminPanel = 'overview' | 'users' | 'invoices' | 'create-course' | 'live-courses' | 'hero' | 'faq' | 'categories' | 'manage-team' | 'courses-analytics' | 'ai-chat';

const blankFaq = (): FaqItem => ({ q: '', a: '' });
const blankCategory = (): CategoryItem => ({ id: `category-${Date.now()}`, label: '', icon: '📚', pill: 'pill-gold' });
const blankCourse = (): Course => ({
  id: `new-course-${Date.now()}`,
  level: 'BEGINNER',
  accent: 'gold',
  icon: '📘',
  tag: 'Development',
  rating: '4.5',
  reviews: '0',
  title: 'New Course Title',
  byline: 'by SkillForge Instructor',
  duration: '12h',
  price: '$49',
  oldPrice: '$99',
  videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  previewSeconds: 300,
});

type CourseDraft = {
  title: string;
  id: string;
  icon: string;
  tag: string;
  level: Course['level'];
  accent: Course['accent'];
  duration: string;
  price: string;
  oldPrice: string;
  byline: string;
  videoUrl: string;
  description: string;
};

const blankCourseDraft = (): CourseDraft => ({
  title: '',
  id: '',
  icon: '📘',
  tag: 'Development',
  level: 'BEGINNER',
  accent: 'gold',
  duration: '12h',
  price: '$49',
  oldPrice: '$99',
  byline: 'by SkillForge Instructor',
  videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  description: '',
});

const normalizeCourseId = (title: string): string =>
  title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-') || `course-${Date.now()}`;

const parseMoneyValue = (value: string): number => {
  const normalized = value.replace(/[^0-9.]/g, '');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatRelativeTime = (timestamp: number): string => {
  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

const getMonthKey = (date: Date): string => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const getMonthLabel = (year: number, monthIndex: number): string =>
  new Date(year, monthIndex, 1).toLocaleString('en-US', { month: 'short' });

const getInitialCategories = (): CategoryItem[] => {
  if (typeof window === 'undefined') return DEFAULT_CATEGORIES;

  const storedCategories = window.localStorage.getItem(CATEGORIES_STORAGE_KEY);
  if (!storedCategories) return DEFAULT_CATEGORIES;

  try {
    const parsed = JSON.parse(storedCategories) as CategoryItem[];
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_CATEGORIES;

    const normalized = parsed
      .map((item, index) => ({
        id: item.id?.trim() || `category-${index + 1}`,
        label: item.label?.trim() || '',
        icon: item.icon?.trim() || '📚',
        pill: item.pill,
      }))
      .filter((item) => item.label)
      .map((item) => ({
        ...item,
        pill: ['pill-gold', 'pill-teal', 'pill-violet', 'pill-rose'].includes(item.pill)
          ? item.pill
          : 'pill-gold',
      }));

    return normalized.length > 0 ? normalized : DEFAULT_CATEGORIES;
  } catch {
    return DEFAULT_CATEGORIES;
  }
};

const getInitialHeroImage = (): string => {
  if (typeof window === 'undefined') return DEFAULT_HERO_IMAGE_URL;
  return window.localStorage.getItem(HERO_IMAGE_STORAGE_KEY)?.trim() || DEFAULT_HERO_IMAGE_URL;
};

const getInitialFaqItems = (): FaqItem[] => {
  if (typeof window === 'undefined') return DEFAULT_FAQS;

  const storedFaqs = window.localStorage.getItem(FAQ_STORAGE_KEY);
  if (!storedFaqs) return DEFAULT_FAQS;

  try {
    const parsed = JSON.parse(storedFaqs) as FaqItem[];
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_FAQS;
    const normalizedFaqs = parsed.filter((item) => item.q?.trim() && item.a?.trim());
    return normalizedFaqs.length > 0 ? normalizedFaqs : DEFAULT_FAQS;
  } catch {
    return DEFAULT_FAQS;
  }
};

export default function AdminDashboard() {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;
  const [activePanel, setActivePanel] = useState<AdminPanel>('overview');
  const [chatMsgs, setChatMsgs] = useState<UserAdminChatMessage[]>(getInitialUserAdminChat);
  const [chatInput, setChatInput] = useState('');
  const [faqItems, setFaqItems] = useState<FaqItem[]>(getInitialFaqItems);
  const [faqStatus, setFaqStatus] = useState('');
  const [heroImageInput, setHeroImageInput] = useState(getInitialHeroImage);
  const [heroStatus, setHeroStatus] = useState('');
  const [categoriesItems, setCategoriesItems] = useState<CategoryItem[]>(getInitialCategories);
  const [categoriesStatus, setCategoriesStatus] = useState('');
  const [managedCourses, setManagedCourses] = useState<Course[]>(getManagedCoursesClient);
  const [managedCoursesStatus, setManagedCoursesStatus] = useState('');
  const [courseDraft, setCourseDraft] = useState<CourseDraft>(blankCourseDraft);
  const [courseDraftStatus, setCourseDraftStatus] = useState('');
  const [adminNotifications, setAdminNotifications] = useState<AdminNotification[]>(getAdminNotifications);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loggedInUsers, setLoggedInUsers] = useState<
    Array<{
      id: string;
      name: string;
      email: string;
      role: 'user' | 'admin';
      authProvider: string;
      initials: string;
      lastLoginAt: string | null;
      loginCount: number;
      createdAt: string;
      lastLogins?: string[];
    }>
  >([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [expandedUsers, setExpandedUsers] = useState<Record<string, boolean>>({});
  const [userHistories, setUserHistories] = useState<Record<string, string[]>>({});
  const [orders, setOrders] = useState<CourseOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [teamStatus, setTeamStatus] = useState('');
  const [meetingRoom, setMeetingRoom] = useState<string | null>(null);
  const [meetingOrder, setMeetingOrder] = useState<null | { id: string; buyerEmail: string; buyerName: string; courseTitle: string }>(null);
    const [reviewTick, setReviewTick] = useState(0);
  const pollingTimersRef = useRef<Record<string, number>>({});
  const chatEndRef = useRef<HTMLDivElement>(null);
  const notificationPanelRef = useRef<HTMLDivElement>(null);
  const prevUnreadNotificationsRef = useRef(0);
  const notificationInitDoneRef = useRef(false);
  const interfaceStartSoundPlayedRef = useRef(false);

  useEffect(() => {
    if (!user || user.role !== 'admin') router.replace('/dashboard');
  }, [user, router]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    if (activePanel !== 'users' && activePanel !== 'manage-team' && activePanel !== 'overview') return;

    const controller = new AbortController();
    const loadUsers = async () => {
      setUsersLoading(true);
      setUsersError(null);

      try {
        const res = await fetch('/api/admin/users', { signal: controller.signal });
        let data: unknown = null;

        try {
          data = await res.json();
        } catch {
          // ignore parse errors
        }

        if (!res.ok) {
          const msg = typeof data === 'object' && data && 'error' in data
            ? String((data as { error?: unknown }).error ?? `Server returned ${res.status}`)
            : `Server returned ${res.status}`;
          throw new Error(msg);
        }

        // Support multiple response shapes:
        // - { ok: true, users: [...] }
        // - { users: [...] }
        // - [...] (array directly)
        let usersList: typeof loggedInUsers = [];
        if (Array.isArray(data)) {
          usersList = data;
        } else if (typeof data === 'object' && data && 'users' in data && Array.isArray((data as { users?: unknown }).users)) {
          usersList = (data as { users: typeof loggedInUsers }).users;
        }

        setLoggedInUsers(usersList);
      } catch (err) {
        if (controller.signal.aborted) return;
        setUsersError(err instanceof Error ? err.message : 'Unable to load users.');
      } finally {
        if (controller.signal.aborted) return;
        setUsersLoading(false);
      }
    };

    void loadUsers();

    return () => controller.abort();
  }, [activePanel, user]);

  const fetchHistory = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/history`);
      const data = await res.json();
      if (res.ok && data && Array.isArray(data.events)) {
        setUserHistories((prev) => ({ ...prev, [userId]: data.events }));
      }
    } catch {
      // ignore
    }
  };

  const updateTeamRole = async (memberId: string, nextRole: 'user' | 'admin') => {
    setTeamStatus('');

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: memberId, role: nextRole }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        throw new Error((data && typeof data === 'object' && 'error' in data && String(data.error)) || 'Unable to update role.');
      }

      setLoggedInUsers((prev) => prev.map((member) => (member.id === memberId ? { ...member, role: nextRole } : member)));
      setTeamStatus(`Role updated to ${nextRole.toUpperCase()}.`);
    } catch (error) {
      setTeamStatus(error instanceof Error ? error.message : 'Unable to update role.');
    }
  };

  // Poll login history for expanded users
  useEffect(() => {
    const startPolling = (userId: string) => {
      // immediate fetch
      fetchHistory(userId);
      if (pollingTimersRef.current[userId]) return;
      const id = window.setInterval(() => fetchHistory(userId), 5000);
      pollingTimersRef.current[userId] = id as unknown as number;
    };

    const stopPolling = (userId: string) => {
      const id = pollingTimersRef.current[userId];
      if (id) {
        clearInterval(id);
        delete pollingTimersRef.current[userId];
      }
    };

    const expandedIds = Object.keys(expandedUsers).filter((k) => expandedUsers[k]);

    // start polling for newly expanded
    for (const id of expandedIds) {
      startPolling(id);
    }

    // stop polling for collapsed
    const tracked = Object.keys(pollingTimersRef.current);
    for (const id of tracked) {
      if (!expandedIds.includes(id)) stopPolling(id);
    }

    const timersSnapshot = { ...pollingTimersRef.current };

    return () => {
      // cleanup all timers
      const trackedNow = Object.keys(timersSnapshot);
      for (const id of trackedNow) stopPolling(id);
    };
  }, [expandedUsers]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMsgs]);

  useEffect(() => subscribeUserAdminChat(() => setChatMsgs(getInitialUserAdminChat())), []);
  useEffect(() => subscribeAdminNotifications(() => setAdminNotifications(getAdminNotifications())), []);

  useEffect(() => {
    const syncReviews = () => setReviewTick((value) => value + 1);
    const onStorage = (event: StorageEvent) => {
      if (event.key === REVIEW_STORAGE_KEY) syncReviews();
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener(REVIEW_UPDATED_EVENT, syncReviews);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(REVIEW_UPDATED_EVENT, syncReviews);
    };
  }, []);

  const loadOrders = useCallback(async () => {
    if (!user || user.role !== 'admin') return;
    if (activePanel !== 'overview' && activePanel !== 'invoices' && activePanel !== 'courses-analytics') return;

    const controller = new AbortController();

    try {
      setOrdersLoading(true);
      setOrdersError(null);

      const res = await fetch('/api/admin/orders', { signal: controller.signal });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const message = typeof data === 'object' && data && 'error' in data
          ? String((data as { error?: unknown }).error ?? 'Unable to load orders.')
          : 'Unable to load orders.';
        throw new Error(message);
      }

      const apiOrders = Array.isArray(data?.orders)
        ? data.orders.filter(
            (order: CourseOrder) =>
              order.status === 'paid' &&
              Boolean(order.buyerEmail?.trim())
          )
        : [];

      const localOrders = getPaidOrders();
      const mergedOrders = [...apiOrders, ...localOrders].reduce<CourseOrder[]>((acc, order) => {
        if (acc.some((item) => item.id === order.id)) return acc;
        if (!order.buyerEmail?.trim()) return acc;
        return [order, ...acc];
      }, []);

      setOrders(mergedOrders.sort((a, b) => b.createdAt - a.createdAt));
    } catch (error) {
      if (controller.signal.aborted) return;
      const localOrders = getPaidOrders().filter((order) => Boolean(order.buyerEmail?.trim()));
      setOrders(localOrders.sort((a, b) => b.createdAt - a.createdAt));
      setOrdersError(error instanceof Error ? error.message : 'Unable to load orders.');
    } finally {
      if (!controller.signal.aborted) {
        setOrdersLoading(false);
      }
    }
  }, [activePanel, user]);

  const coursesAnalytics = useMemo(() => {
    const courseLookup = new Map(managedCourses.map((course) => [course.id, course] as const));
    const paidOrders = orders.filter((order) => order.status === 'paid' && order.source !== 'demo');
    const totalRevenue = paidOrders.reduce((sum, order) => sum + parseMoneyValue(order.amount), 0);

    const courseStats = managedCourses.map((course) => {
      const matchingOrders = paidOrders.filter((order) => order.courseId === course.id || order.courseTitle === course.title);
      return {
        ...course,
        sales: matchingOrders.length,
        revenue: matchingOrders.reduce((sum, order) => sum + parseMoneyValue(order.amount), 0),
      };
    });

    const topCourse = [...courseStats].sort((a, b) => b.sales - a.sales || b.revenue - a.revenue)[0] ?? null;
    const topCategories = Array.from(
      courseStats.reduce((map, course) => {
        const key = course.tag?.trim() || 'Uncategorized';
        const next = map.get(key) ?? { tag: key, courses: 0, sales: 0, revenue: 0 };
        next.courses += 1;
        next.sales += course.sales;
        next.revenue += course.revenue;
        map.set(key, next);
        return map;
      }, new Map<string, { tag: string; courses: number; sales: number; revenue: number }>()).values()
    ).sort((a, b) => b.revenue - a.revenue || b.sales - a.sales);

    return {
      totalCourses: managedCourses.length,
      activeCourses: managedCourses.filter((course) => Boolean(course.videoUrl?.trim())).length,
      totalOrders: paidOrders.length,
      totalRevenue,
      avgCoursePrice: managedCourses.length > 0
        ? managedCourses.reduce((sum, course) => sum + parseMoneyValue(course.price), 0) / managedCourses.length
        : 0,
      courseStats: courseStats.sort((a, b) => b.revenue - a.revenue || b.sales - a.sales),
      topCourse,
      topCategories,
      recentOrders: [...paidOrders].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5),
      catalogCoverage: courseLookup.size,
    };
  }, [managedCourses, orders]);

  const dashboardOverview = useMemo(() => {
    const totalUsers = loggedInUsers.length;
    const adminUsers = loggedInUsers.filter((member) => member.role === 'admin').length;
    const totalCourses = managedCourses.length;
    const activeCourses = coursesAnalytics.activeCourses;
    const paidOrders = coursesAnalytics.totalOrders;
    const revenue = coursesAnalytics.totalRevenue;
    const conversionRate = totalUsers > 0 ? (paidOrders / totalUsers) * 100 : 0;

    return {
      stats: [
        { label: 'Active Users', value: totalUsers.toLocaleString(), change: `${adminUsers} admins`, icon: '👥', color: 'var(--teal)' },
        { label: 'Total Courses', value: totalCourses.toLocaleString(), change: `${activeCourses} live`, icon: '📚', color: 'var(--gold)' },
        { label: 'Revenue', value: `$${revenue.toFixed(0)}`, change: `${paidOrders} paid`, icon: '💰', color: 'var(--green)' },
        { label: 'Conversion', value: `${conversionRate.toFixed(1)}%`, change: 'Paid orders / users', icon: '📈', color: 'var(--violet)' },
      ],
      recentTransactions: coursesAnalytics.recentOrders,
      topCourse: coursesAnalytics.topCourse,
    };
  }, [loggedInUsers, managedCourses, coursesAnalytics]);

  const reviewOverview = useMemo(() => {
    void reviewTick;

    const reviews = getStoredReviews();
    const sortedReviews = [...reviews].sort((left, right) => right.updatedAt - left.updatedAt);
    const reviewCounts = sortedReviews.reduce<Record<string, number>>((acc, review) => {
      acc[review.courseTitle] = (acc[review.courseTitle] || 0) + 1;
      return acc;
    }, {});

    return {
      totalReviews: sortedReviews.length,
      recentReviews: sortedReviews.slice(0, 6),
      topCourses: Object.entries(reviewCounts)
        .map(([courseTitle, count]) => ({ courseTitle, count }))
        .sort((left, right) => right.count - left.count)
        .slice(0, 4),
    };
  }, [reviewTick]);

  const dashboardTrends = useMemo(() => {
    const now = new Date();
    const monthKeys = Array.from({ length: 12 }, (_, index) => {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - (11 - index), 1);
      return {
        key: getMonthKey(monthDate),
        label: getMonthLabel(monthDate.getFullYear(), monthDate.getMonth()),
      };
    });

    const userCounts = monthKeys.map(({ key }) =>
      loggedInUsers.filter((member) => {
        const timestamp = member.lastLoginAt ? new Date(member.lastLoginAt).getTime() : member.createdAt ? new Date(member.createdAt).getTime() : 0;
        if (!timestamp) return false;
        return getMonthKey(new Date(timestamp)) === key;
      }).length
    );

    const orderCounts = monthKeys.map(({ key }) =>
      orders.filter((order) => getMonthKey(new Date(order.createdAt)) === key).length
    );

    const revenueCounts = monthKeys.map(({ key }) =>
      orders
        .filter((order) => getMonthKey(new Date(order.createdAt)) === key)
        .reduce((sum, order) => sum + parseMoneyValue(order.amount), 0)
    );

    return {
      monthLabels: monthKeys.map((item) => item.label),
      userCounts,
      orderCounts,
      revenueCounts,
      maxUserCount: Math.max(...userCounts, 1),
      maxOrderCount: Math.max(...orderCounts, 1),
    };
  }, [loggedInUsers, orders]);

  useEffect(() => {
    const onPayments = () => { void loadOrders(); };
    window.addEventListener(PAYMENTS_UPDATED_EVENT, onPayments as EventListener);
    return () => window.removeEventListener(PAYMENTS_UPDATED_EVENT, onPayments as EventListener);
  }, [loadOrders]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!notificationPanelRef.current?.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      window.addEventListener('mousedown', handleOutsideClick);
    }

    return () => {
      window.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [showNotifications]);

  const unreadNotifications = adminNotifications.filter((item) => !item.read).length;

  const playNotificationBeep = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = 980;
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.07, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

      osc.start(now);
      osc.stop(now + 0.28);

      window.setTimeout(() => {
        void ctx.close();
      }, 360);
    } catch {
      // Ignore sound errors when browser blocks audio context.
    }
  };

  useEffect(() => {
    if (!notificationInitDoneRef.current) {
      notificationInitDoneRef.current = true;
      prevUnreadNotificationsRef.current = unreadNotifications;
      return;
    }

    if (unreadNotifications > prevUnreadNotificationsRef.current) {
      playNotificationBeep();
    }

    prevUnreadNotificationsRef.current = unreadNotifications;
  }, [unreadNotifications]);

  useEffect(() => {
    if (interfaceStartSoundPlayedRef.current) return;
    if (!user || user.role !== 'admin') return;

    interfaceStartSoundPlayedRef.current = true;
    window.setTimeout(() => {
      playNotificationBeep();
    }, 120);
  }, [user]);

  const handleSendMessage = () => {
    const msg = chatInput.trim();
    if (!msg || !user) return;

    const senderName = user.name ?? 'Admin User';

    const nextMessage: UserAdminChatMessage = {
      id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      senderRole: 'admin',
      senderName,
      text: msg,
      createdAt: Date.now(),
    };

    const updated = saveUserAdminChat([...chatMsgs, nextMessage]);
    setChatMsgs(updated);
    appendUserNotification({
      type: 'message',
      title: 'Admin replied',
      description: `${senderName} replied to your support chat.`,
    });
    setChatInput('');
  };

  const updateFaqItem = (index: number, field: keyof FaqItem, value: string) => {
    setFaqItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
    if (faqStatus) setFaqStatus('');
  };

  const addFaqItem = () => {
    setFaqItems((prev) => [...prev, blankFaq()]);
    if (faqStatus) setFaqStatus('');
  };

  const removeFaqItem = (index: number) => {
    setFaqItems((prev) => prev.filter((_, i) => i !== index));
    if (faqStatus) setFaqStatus('');
  };

  const saveFaqItems = () => {
    const normalizedFaqs = faqItems
      .map((item) => ({ q: item.q.trim(), a: item.a.trim() }))
      .filter((item) => item.q && item.a);

    if (normalizedFaqs.length === 0) {
      setFaqStatus('At least one FAQ question and answer is required.');
      return;
    }

    window.localStorage.setItem(FAQ_STORAGE_KEY, JSON.stringify(normalizedFaqs));
    window.dispatchEvent(new Event('skillforge-faq-updated'));
    setFaqItems(normalizedFaqs);
    setFaqStatus('Homepage FAQ updated successfully.');
  };

  const resetFaqItems = () => {
    window.localStorage.removeItem(FAQ_STORAGE_KEY);
    window.dispatchEvent(new Event('skillforge-faq-updated'));
    setFaqItems(DEFAULT_FAQS);
    setFaqStatus('FAQ reset to default content.');
  };

  const saveHeroImage = () => {
    const normalizedUrl = heroImageInput.trim();
    window.localStorage.setItem(HERO_IMAGE_STORAGE_KEY, normalizedUrl);
    window.dispatchEvent(new Event('skillforge-hero-updated'));
    setHeroImageInput(normalizedUrl);
    setHeroStatus('Homepage hero image updated successfully.');
  };

  const resetHeroImage = () => {
    window.localStorage.removeItem(HERO_IMAGE_STORAGE_KEY);
    window.dispatchEvent(new Event('skillforge-hero-updated'));
    setHeroImageInput(DEFAULT_HERO_IMAGE_URL);
    setHeroStatus('Hero image reset to default.');
  };

  const updateCategoryItem = (index: number, field: keyof CategoryItem, value: string) => {
    setCategoriesItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
    if (categoriesStatus) setCategoriesStatus('');
  };

  const addCategoryItem = () => {
    setCategoriesItems((prev) => [...prev, blankCategory()]);
    if (categoriesStatus) setCategoriesStatus('');
  };

  const removeCategoryItem = (index: number) => {
    setCategoriesItems((prev) => prev.filter((_, i) => i !== index));
    if (categoriesStatus) setCategoriesStatus('');
  };

  const saveCategoriesItems = () => {
    const normalizedCategories = categoriesItems
      .map((item, index) => ({
        id: item.id?.trim() || `category-${index + 1}`,
        label: item.label.trim(),
        icon: item.icon.trim() || '📚',
        pill: item.pill,
      }))
      .filter((item) => item.label)
      .map((item) => ({
        ...item,
        pill: ['pill-gold', 'pill-teal', 'pill-violet', 'pill-rose'].includes(item.pill)
          ? item.pill
          : 'pill-gold',
      }));

    if (normalizedCategories.length === 0) {
      setCategoriesStatus('At least one category label is required.');
      return;
    }

    window.localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(normalizedCategories));
    window.dispatchEvent(new Event('skillforge-categories-updated'));
    setCategoriesItems(normalizedCategories);
    setCategoriesStatus('Homepage categories updated successfully.');
  };

  const resetCategoriesItems = () => {
    window.localStorage.removeItem(CATEGORIES_STORAGE_KEY);
    window.dispatchEvent(new Event('skillforge-categories-updated'));
    setCategoriesItems(DEFAULT_CATEGORIES);
    setCategoriesStatus('Categories reset to default content.');
  };

  const updateManagedCourseField = (index: number, field: keyof Course, value: string) => {
    setManagedCourses((prev) => prev.map((course, i) => (i === index ? { ...course, [field]: value } : course)));
    if (managedCoursesStatus) setManagedCoursesStatus('');
  };

  const addManagedCourse = () => {
    setManagedCourses((prev) => [...prev, blankCourse()]);
    if (managedCoursesStatus) setManagedCoursesStatus('');
  };

  const removeManagedCourse = (index: number) => {
    setManagedCourses((prev) => prev.filter((_, i) => i !== index));
    if (managedCoursesStatus) setManagedCoursesStatus('');
  };

  const handleDeleteNotification = (id: string) => {
    setAdminNotifications(deleteAdminNotification(id));
  };

  const handleDeleteAllNotifications = () => {
    setAdminNotifications(clearAllAdminNotifications());
  };

  const saveManagedCoursesItems = () => {
    if (managedCourses.length === 0) {
      setManagedCoursesStatus('At least one course is required.');
      return;
    }

    const normalized = saveManagedCourses(managedCourses);
    setManagedCourses(normalized);
    setManagedCoursesStatus('Courses and videos updated successfully.');
  };

  const resetManagedCoursesItems = () => {
    resetManagedCourses();
    setManagedCourses(getDefaultManagedCourses());
    setManagedCoursesStatus('Courses reset to default content.');
  };

  const handleCreateCourse = () => {
    const title = courseDraft.title.trim();
    const videoUrl = courseDraft.videoUrl.trim();

    if (!title) {
      setCourseDraftStatus('Course title is required.');
      return;
    }

    if (!videoUrl) {
      setCourseDraftStatus('Video URL is required.');
      return;
    }

    const nextCourse = {
      id: courseDraft.id.trim() || normalizeCourseId(title),
      title,
      level: courseDraft.level,
      accent: courseDraft.accent,
      icon: courseDraft.icon.trim() || '📘',
      tag: courseDraft.tag.trim() || 'Development',
      rating: '5.0',
      reviews: '0',
      byline: courseDraft.byline.trim() || 'by SkillForge Instructor',
      duration: courseDraft.duration.trim() || '12h',
      price: courseDraft.price.trim() || '$49',
      oldPrice: courseDraft.oldPrice.trim() || '$99',
      videoUrl,
      previewSeconds: 300,
      description: courseDraft.description.trim() || undefined,
      lessons: '24 lectures',
      instructor: courseDraft.byline.replace(/^by\s+/i, '').trim() || 'SkillForge Instructor',
      certificate: 'Yes, Verified',
      language: 'English',
      access: 'Lifetime',
      learnings: [],
      relatedCourses: [],
    };

    const normalized = saveManagedCourses([...managedCourses, nextCourse]);
    setManagedCourses(normalized);
    setCourseDraft(blankCourseDraft());
    setCourseDraftStatus('Course created successfully. Open Live Courses to edit it further.');
    setManagedCoursesStatus('Courses and videos updated successfully.');
    setActivePanel('live-courses');
  };

  const resetCourseDraft = () => {
    setCourseDraft(blankCourseDraft());
    setCourseDraftStatus('');
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 68px)', marginTop: '68px', background: 'var(--bg-primary)', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div style={{ width: '240px', padding: '20px 14px 20px 20px', color: 'var(--text-secondary)', maxHeight: 'calc(100vh - 68px)' }}>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '16px', overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Premium Header */}
        <div style={{ padding: '20px 20px 18px', marginBottom: '0', position: 'relative', borderBottom: '1px solid var(--border-default)' }}>
          {/* Header Title */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ fontSize: '10px', fontWeight: '900', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: 'var(--font-display)' }}>ELEARNING</div>
            <button
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '4px 8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--gold)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              ‹
            </button>
          </div>

          {/* Profile Section */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '14px' }}>
            {/* Avatar */}
            <div
              style={{
                width: '88px',
                height: '88px',
                borderRadius: '50%',
                background: `linear-gradient(135deg, var(--gold) 0%, var(--teal) 100%)`,
                padding: '2.5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(251, 146, 60, 0.15)',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  background: 'var(--bg-card-alt)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '36px',
                  fontWeight: '700',
                  color: 'var(--gold)',
                  fontFamily: 'var(--font-display)',
                }}
              >
                {user?.initials?.[0] || 'A'}
              </div>
            </div>

            {/* User Name */}
            <div style={{ paddingTop: '4px' }}>
              <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '3px', letterSpacing: '-0.3px' }}>
                {user?.name || 'Admin User'}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                - Admin
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '12px', opacity: 0.7 }}>Main</div>
          <div
            onClick={() => setActivePanel('overview')}
            style={{
              padding: '10px 12px',
              marginBottom: '8px',
              borderRadius: '8px',
              cursor: 'pointer',
              background: activePanel === 'overview' ? 'var(--gold-dim)' : 'transparent',
              color: activePanel === 'overview' ? 'var(--gold)' : 'var(--text-secondary)',
              fontSize: '14px',
              transition: 'all 0.2s ease',
            }}
          >
            📊 Dashboard
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '12px', opacity: 0.7 }}>Data</div>
          {(['users', 'invoices'] as AdminPanel[]).map(panel => (
            <div
              key={panel}
              onClick={() => setActivePanel(panel)}
              style={{
                padding: '10px 12px',
                marginBottom: '8px',
                borderRadius: '8px',
                cursor: 'pointer',
                background: activePanel === panel ? 'var(--gold-dim)' : 'transparent',
                color: activePanel === panel ? 'var(--gold)' : 'var(--text-secondary)',
                fontSize: '14px',
                transition: 'all 0.2s ease',
              }}
            >
              {panel === 'users' && '👥'} {panel === 'invoices' && '📄'} {panel === 'users' ? 'Users' : 'Invoices'}
            </div>
          ))}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '12px', opacity: 0.7 }}>Content</div>
          {(['create-course', 'live-courses'] as AdminPanel[]).map(panel => (
            <div
              key={panel}
              onClick={() => setActivePanel(panel)}
              style={{
                padding: '10px 12px',
                marginBottom: '8px',
                borderRadius: '8px',
                cursor: 'pointer',
                background: activePanel === panel ? 'var(--gold-dim)' : 'transparent',
                color: activePanel === panel ? 'var(--gold)' : 'var(--text-secondary)',
                fontSize: '14px',
                transition: 'all 0.2s ease',
              }}
            >
              {panel === 'create-course' && '✏️'} {panel === 'live-courses' && '🎥'} {panel === 'create-course' ? 'Create Course' : 'Live Courses'}
            </div>
          ))}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '12px', opacity: 0.7 }}>Customization</div>
          {(['hero', 'faq', 'categories'] as AdminPanel[]).map(panel => (
            <div
              key={panel}
              onClick={() => setActivePanel(panel)}
              style={{
                padding: '10px 12px',
                marginBottom: '8px',
                borderRadius: '8px',
                cursor: 'pointer',
                background: activePanel === panel ? 'var(--gold-dim)' : 'transparent',
                color: activePanel === panel ? 'var(--gold)' : 'var(--text-secondary)',
                fontSize: '14px',
                transition: 'all 0.2s ease',
              }}
            >
              {panel === 'hero' && '🎯'} {panel === 'faq' && '❓'} {panel === 'categories' && '📂'} {panel === 'hero' ? 'Hero' : panel === 'faq' ? 'FAQ' : 'Categories'}
            </div>
          ))}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '12px', opacity: 0.7 }}>Controllers</div>
          <div
            onClick={() => setActivePanel('manage-team')}
            style={{
              padding: '10px 12px',
              marginBottom: '8px',
              borderRadius: '8px',
              cursor: 'pointer',
              background: activePanel === 'manage-team' ? 'var(--gold-dim)' : 'transparent',
              color: activePanel === 'manage-team' ? 'var(--gold)' : 'var(--text-secondary)',
              fontSize: '14px',
              transition: 'all 0.2s ease',
            }}
          >
            👨‍💼 Manage Team
          </div>
        </div>

        <div>
          <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '12px', opacity: 0.7 }}>Analytics</div>
          {(['courses-analytics', 'ai-chat'] as AdminPanel[]).map(panel => (
            <div
              key={panel}
              onClick={() => setActivePanel(panel)}
              style={{
                padding: '10px 12px',
                marginBottom: '8px',
                borderRadius: '8px',
                cursor: 'pointer',
                background: activePanel === panel ? 'var(--gold-dim)' : 'transparent',
                color: activePanel === panel ? 'var(--gold)' : 'var(--text-secondary)',
                fontSize: '14px',
                transition: 'all 0.2s ease',
              }}
            >
              {panel === 'courses-analytics' && '📊'} {panel === 'ai-chat' && '💬'} {panel === 'courses-analytics' ? 'Courses Analytics' : 'User Chat'}
            </div>
          ))}
        </div>
        </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '40px', maxHeight: 'calc(100vh - 68px)' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
          <div ref={notificationPanelRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotifications((prev) => !prev)}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                border: '1px solid var(--border-default)',
                background: 'var(--bg-surface)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                fontSize: '18px',
              }}
              aria-label="Toggle notifications"
              title="Notifications"
            >
              🔔
              {unreadNotifications > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    minWidth: '18px',
                    height: '18px',
                    borderRadius: '999px',
                    background: 'var(--gold)',
                    color: 'var(--text-inverse)',
                    fontSize: '10px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 5px',
                    border: '1px solid var(--bg-primary)',
                  }}
                >
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </span>
              )}
            </button>

            {showNotifications && (
              <div
                style={{
                  position: 'absolute',
                  top: '52px',
                  right: 0,
                  width: '360px',
                  maxHeight: '420px',
                  overflowY: 'auto',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '12px',
                  padding: '14px',
                  boxShadow: '0 16px 36px rgba(0, 0, 0, 0.25)',
                  zIndex: 50,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <strong style={{ color: 'var(--text-primary)', fontSize: '14px' }}>
                    Notifications {unreadNotifications > 0 ? `(${unreadNotifications} new)` : ''}
                  </strong>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => setAdminNotifications(markAllAdminNotificationsRead())}
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-secondary)',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      Mark all read
                    </button>
                    <button
                      onClick={() => {
                        handleDeleteAllNotifications();
                      }}
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-secondary)',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      Delete all
                    </button>
                  </div>
                </div>

                {adminNotifications.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>No notifications yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {adminNotifications.map((item) => (
                      <div key={item.id} style={{ border: '1px solid var(--border-default)', borderRadius: '8px', padding: '10px', background: item.read ? 'var(--bg-card-alt)' : 'var(--gold-dim)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <strong style={{ color: 'var(--text-primary)', fontSize: '13px' }}>{item.title}</strong>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
                              {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <button
                              onClick={() => handleDeleteNotification(item.id)}
                              style={{
                                background: 'transparent',
                                border: '1px solid var(--border-default)',
                                color: 'var(--text-secondary)',
                                borderRadius: '6px',
                                padding: '2px 7px',
                                fontSize: '11px',
                                cursor: 'pointer',
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{item.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Overview */}
        {activePanel === 'overview' && (
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '30px' }}>
              Admin Dashboard
            </h1>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
              {dashboardOverview.stats.map((stat, i) => (
                <div
                  key={i}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '12px',
                    padding: '24px',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px var(--gold-glow)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                    <span style={{ fontSize: '32px' }}>{stat.icon}</span>
                    <span style={{ color: stat.color, fontWeight: '600', fontSize: '14px' }}>{stat.change}</span>
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    {stat.label}
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)' }}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px' }}>
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '20px' }}>
                  Users Analytics
                </h3>
                <div style={{ height: '220px', background: 'linear-gradient(to top, var(--teal-dim), transparent)', borderRadius: '8px', padding: '18px', display: 'flex', alignItems: 'flex-end', gap: '6px' }}>
                  {dashboardTrends.userCounts.map((value, index) => {
                    const height = `${Math.max((value / dashboardTrends.maxUserCount) * 100, value > 0 ? 10 : 4)}%`;

                    return (
                      <div key={`user-bar-${index}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <div
                          title={`${dashboardTrends.monthLabels[index]}: ${value} logins`}
                          style={{
                            width: '100%',
                            height,
                            minHeight: value > 0 ? '10px' : '4px',
                            background: 'linear-gradient(to top, var(--teal), rgba(20, 184, 166, 0.65))',
                            borderRadius: '6px 6px 0 0',
                          }}
                        />
                        <span style={{ fontSize: '10px', color: 'var(--text-secondary)', transform: 'rotate(-45deg)', transformOrigin: 'center' }}>
                          {dashboardTrends.monthLabels[index]}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <span>Last 12 months</span>
                  <span>{Math.max(...dashboardTrends.userCounts, 0)} max logins</span>
                </div>
              </div>

              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '20px' }}>
                  Orders Analytics
                </h3>
                <div style={{ height: '220px', background: 'linear-gradient(to top, var(--gold-dim), transparent)', borderRadius: '8px', padding: '18px', display: 'flex', alignItems: 'flex-end', gap: '6px' }}>
                  {dashboardTrends.orderCounts.map((value, index) => {
                    const height = `${Math.max((value / dashboardTrends.maxOrderCount) * 100, value > 0 ? 10 : 4)}%`;

                    return (
                      <div key={`order-bar-${index}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <div
                          title={`${dashboardTrends.monthLabels[index]}: ${value} orders`}
                          style={{
                            width: '100%',
                            height,
                            minHeight: value > 0 ? '10px' : '4px',
                            background: 'linear-gradient(to top, var(--gold), rgba(251, 146, 60, 0.65))',
                            borderRadius: '6px 6px 0 0',
                            border: '1px solid rgba(251, 146, 60, 0.25)',
                          }}
                        />
                        <span style={{ fontSize: '10px', color: 'var(--text-secondary)', transform: 'rotate(-45deg)', transformOrigin: 'center' }}>
                          {dashboardTrends.monthLabels[index]}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <span>Monthly paid order count</span>
                  <span>{Math.max(...dashboardTrends.orderCounts, 0)} max orders</span>
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '24px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>All Reviews</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Live review feed from all learners. Admins can only view.</p>
                </div>
                <span style={{ padding: '7px 10px', borderRadius: '999px', border: '1px solid var(--border-default)', color: 'var(--gold)', fontSize: '12px', fontWeight: 700 }}>
                  {reviewOverview.totalReviews} total
                </span>
              </div>

              {reviewOverview.totalReviews === 0 ? (
                <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>No reviews submitted yet.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.7fr', gap: '16px' }}>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {reviewOverview.recentReviews.map((review) => (
                      <div key={`${review.courseId}-${review.userEmail}-${review.updatedAt}`} style={{ border: '1px solid var(--border-default)', borderRadius: '12px', padding: '14px', background: 'var(--bg-card-alt)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>{review.courseTitle}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{review.userName} · {review.userEmail}</div>
                          </div>
                          <div style={{ color: 'var(--gold)', fontWeight: 700 }}>{'★'.repeat(review.rating)}</div>
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 700, marginBottom: 6 }}>{review.title}</div>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6 }}>
                          {review.comment}
                        </p>
                        <div style={{ marginTop: 8, fontSize: '12px', color: 'var(--text-secondary)' }}>
                          Updated {new Date(review.updatedAt).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'grid', gap: '10px', alignContent: 'start' }}>
                    <div style={{ border: '1px solid var(--border-default)', borderRadius: '12px', padding: '14px', background: 'var(--bg-card-alt)' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Recent Activity</div>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>{reviewOverview.totalReviews}</div>
                    </div>

                    <div style={{ border: '1px solid var(--border-default)', borderRadius: '12px', padding: '14px', background: 'var(--bg-card-alt)' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>Top Reviewed Courses</div>
                      <div style={{ display: 'grid', gap: '8px' }}>
                        {reviewOverview.topCourses.length === 0 ? (
                          <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>No data yet.</div>
                        ) : reviewOverview.topCourses.map((item) => (
                          <div key={item.courseTitle} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', fontSize: '13px' }}>
                            <span style={{ color: 'var(--text-primary)' }}>{item.courseTitle}</span>
                            <strong style={{ color: 'var(--gold)' }}>{item.count}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Recent Transactions */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px', marginBottom: '18px', flexWrap: 'wrap' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
                    Recent Transactions
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Latest paid orders from Stripe and the local fallback store.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ padding: '7px 10px', borderRadius: '999px', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', fontSize: '12px' }}>
                    Total: {dashboardOverview.recentTransactions.length}
                  </span>
                  <span style={{ padding: '7px 10px', borderRadius: '999px', border: '1px solid var(--border-default)', color: 'var(--gold)', fontSize: '12px', fontWeight: 700 }}>
                    Revenue: ${coursesAnalytics.totalRevenue.toFixed(0)}
                  </span>
                </div>
              </div>

              {dashboardOverview.recentTransactions.length === 0 ? (
                <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>No paid transactions yet.</div>
              ) : (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {dashboardOverview.recentTransactions.map((txn) => (
                    <div key={txn.id} style={{ border: '1px solid var(--border-default)', borderRadius: '12px', padding: '14px', background: 'var(--bg-card-alt)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap' }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
                            {txn.courseTitle}
                          </div>
                          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {txn.buyerName} · {txn.buyerEmail}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ padding: '6px 10px', borderRadius: '999px', background: 'var(--gold-dim)', color: 'var(--gold)', fontSize: '12px', fontWeight: 700 }}>
                            {txn.amount}
                          </span>
                          <span style={{ padding: '6px 10px', borderRadius: '999px', border: '1px solid var(--border-default)', color: 'var(--teal)', fontSize: '12px', fontWeight: 700 }}>
                            Paid
                          </span>
                          <span style={{ padding: '6px 10px', borderRadius: '999px', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', fontSize: '12px' }}>
                            {txn.source === 'real' ? 'Stripe' : 'Local'}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {new Date(txn.createdAt).toLocaleString()} · {formatRelativeTime(txn.createdAt)}
                        </div>

                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          Course ID: {txn.courseId}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Users */}
        {activePanel === 'users' && (
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '18px' }}>
              Users (Logged In)
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '18px' }}>
              Shows accounts that have logged in at least once.
            </p>

            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '18px' }}>
              {usersError ? (
                <div style={{ color: 'var(--rose)', fontSize: '13px' }}>{usersError}</div>
              ) : null}

              {usersLoading ? (
                <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Loading users…</div>
              ) : loggedInUsers.length === 0 ? (
                <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>No user logins recorded yet.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                      <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600' }}>Name</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600' }}>Email</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600' }}>Role</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600' }}>Provider</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600' }}>Logins</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600' }}>Last Login</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loggedInUsers.map((u, i) => {
                      const last = u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : '—';
                      const isExpanded = Boolean(expandedUsers[u.id]);

                      return [
                        <tr
                          key={`row-${u.id}`}
                          style={{ borderBottom: i < loggedInUsers.length - 1 ? '1px solid var(--border-default)' : 'none', transition: 'all 0.2s ease' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--gold-dim)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <td style={{ padding: '10px 12px', fontSize: '14px', color: 'var(--text-primary)', fontWeight: '600' }}>{u.name}</td>
                          <td style={{ padding: '10px 12px', fontSize: '14px', color: 'var(--text-secondary)' }}>{u.email}</td>
                          <td style={{ padding: '10px 12px', fontSize: '13px', color: u.role === 'admin' ? 'var(--gold)' : 'var(--text-secondary)', fontWeight: '700' }}>{u.role.toUpperCase()}</td>
                          <td style={{ padding: '10px 12px', fontSize: '13px', color: 'var(--text-secondary)' }}>{u.authProvider}</td>
                          <td style={{ padding: '10px 12px', fontSize: '14px', color: 'var(--text-secondary)' }}>{u.loginCount}</td>
                          <td
                            title={u.lastLogins?.length ? u.lastLogins.join('\n') : undefined}
                            style={{ padding: '10px 12px', fontSize: '13px', color: 'var(--text-secondary)' }}
                          >
                            {last}
                          </td>
                          <td style={{ padding: '10px 12px', display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => setExpandedUsers((prev) => ({ ...prev, [u.id]: !prev[u.id] }))}
                              style={{
                                background: 'transparent',
                                border: '1px solid var(--border-default)',
                                color: 'var(--text-secondary)',
                                borderRadius: '8px',
                                padding: '5px 10px',
                                fontSize: '12px',
                                cursor: 'pointer',
                              }}
                            >
                              {isExpanded ? 'Hide history' : 'Show history'}
                            </button>
                            <button
                              onClick={async () => {
                                if (!confirm(`Delete ${u.name}?`)) return;
                                const res = await fetch('/api/admin/users', {
                                  method: 'DELETE',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ userId: u.id }),
                                });
                                const data = await res.json();
                                if (data.ok) {
                                  setLoggedInUsers((prev) => prev.filter((x) => x.id !== u.id));
                                }
                              }}
                              style={{
                                background: 'transparent',
                                border: '1px solid #f43f5e',
                                color: '#f43f5e',
                                borderRadius: '8px',
                                padding: '5px 10px',
                                fontSize: '12px',
                                cursor: 'pointer',
                              }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>,
                        isExpanded && (
                          <tr key={`expand-${u.id}`} style={{ background: 'var(--bg-card-alt)', borderBottom: i < loggedInUsers.length - 1 ? '1px solid var(--border-default)' : 'none' }}>
                            <td colSpan={7} style={{ padding: '10px 14px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                              <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                                {Array.isArray(userHistories[u.id]) && userHistories[u.id].length > 0 ? (
                                  <ul style={{ margin: 0, paddingLeft: '18px' }}>
                                    {userHistories[u.id].map((ts: string, idx: number) => (
                                      <li key={idx} style={{ marginBottom: '6px' }}>{new Date(ts).toLocaleString()}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  <div style={{ color: 'var(--text-secondary)' }}>Loading history…</div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ),
                      ];
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* AI Chat Panel */}
        {activePanel === 'ai-chat' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', maxWidth: '600px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '20px' }}>
              User Support Chat
            </h1>
            <div
              style={{
                flex: 1,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: '12px',
                padding: '20px',
                overflowY: 'auto',
                marginBottom: '16px',
              }}
            >
              {chatMsgs.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    marginBottom: '16px',
                    display: 'flex',
                    justifyContent: msg.senderRole === 'admin' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '80%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      background: msg.senderRole === 'admin' ? 'var(--gold)' : 'var(--bg-card-alt)',
                      color: msg.senderRole === 'admin' ? 'var(--text-inverse)' : 'var(--text-primary)',
                      fontSize: '14px',
                      lineHeight: '1.5',
                      border: msg.senderRole === 'admin' ? 'none' : '1px solid var(--border-default)',
                    }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: 700, opacity: 0.85, marginBottom: '4px' }}>
                      {msg.senderRole === 'admin' ? 'You (Admin)' : msg.senderName}
                    </div>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
                placeholder="Reply to user message..."
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
              <button
                onClick={handleSendMessage}
                style={{
                  padding: '12px 20px',
                  background: 'var(--gold)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'var(--text-inverse)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                Send
              </button>
            </div>
          </div>
        )}

        {/* Invoices Panel */}
        {activePanel === 'invoices' && (
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '30px' }}>Invoices</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '18px' }}>
              {[
                { label: 'Total Invoices', value: orders.length.toString(), hint: 'Paid orders loaded' },
                { label: 'Real Orders', value: orders.filter((order) => order.source === 'real').length.toString(), hint: 'From Stripe or save route' },
                { label: 'Local Fallback', value: orders.filter((order) => order.source !== 'real').length.toString(), hint: 'Browser stored entries' },
                { label: 'Revenue', value: `$${orders.reduce((sum, order) => sum + parseMoneyValue(order.amount), 0).toFixed(0)}`, hint: 'Combined paid amount' },
              ].map((item) => (
                <div key={item.label} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '18px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>{item.label}</div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>{item.value}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.hint}</div>
                </div>
              ))}
            </div>

            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '24px', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px', marginBottom: '18px', flexWrap: 'wrap' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
                    Invoice Ledger
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Each paid order is shown as an invoice with direct voice-meeting support.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ padding: '7px 10px', borderRadius: '999px', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', fontSize: '12px' }}>
                    Loading: {ordersLoading ? 'Yes' : 'No'}
                  </span>
                  <span style={{ padding: '7px 10px', borderRadius: '999px', border: '1px solid var(--border-default)', color: 'var(--gold)', fontSize: '12px', fontWeight: 700 }}>
                    Voice rooms enabled
                  </span>
                </div>
              </div>

              {ordersError ? (
                <div style={{ textAlign: 'center', marginBottom: 12, color: 'var(--rose)' }}>{ordersError}</div>
              ) : null}
              {ordersLoading ? (
                <div style={{ textAlign: 'center', marginBottom: 12 }}>Loading paid orders...</div>
              ) : null}

              {orders.length === 0 ? (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ marginBottom: 8 }}>No paid invoices yet.</p>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Once a payment is confirmed, the invoice row and voice meeting actions appear here.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {orders.map((o, index) => {
                    const invoiceNo = `INV-${String(index + 1).padStart(3, '0')}`;
                    const isReal = o.source === 'real';
                    const room = `skillforge-invoice-${o.id}`;

                    return (
                      <div key={o.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', padding: 14, borderRadius: 12, background: 'var(--bg-card-alt)', border: '1px solid var(--border-default)' }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                            <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{invoiceNo}</div>
                            <span style={{ padding: '5px 10px', borderRadius: '999px', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 700 }}>
                              {isReal ? 'Stripe' : 'Local'}
                            </span>
                            <span style={{ padding: '5px 10px', borderRadius: '999px', background: 'var(--gold-dim)', color: 'var(--gold)', fontSize: '11px', fontWeight: 700 }}>
                              Paid
                            </span>
                          </div>

                          <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>{o.courseTitle}</div>
                          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', fontSize: '13px', color: 'var(--text-secondary)' }}>
                            <span>{o.buyerName}</span>
                            <span>·</span>
                            <span>{o.buyerEmail}</span>
                            <span>·</span>
                            <span>{new Date(o.createdAt).toLocaleString()}</span>
                            <span>·</span>
                            <span>{formatRelativeTime(o.createdAt)}</span>
                          </div>
                          <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                            Course ID: {o.courseId}
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '220px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Invoice total</span>
                            <strong style={{ color: 'var(--gold)', fontSize: '16px' }}>{o.amount}</strong>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => {
                                setMeetingRoom(room);
                                setMeetingOrder({ id: o.id, buyerEmail: o.buyerEmail, buyerName: o.buyerName, courseTitle: o.courseTitle });
                                window.open(`https://meet.jit.si/${room}`, '_blank');
                              }}
                              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-default)', background: 'var(--gold-dim)', color: 'var(--gold)', cursor: 'pointer', fontWeight: 700, flex: 1 }}
                            >
                              Start Voice Meeting
                            </button>
                            <button
                              onClick={() => {
                                try { navigator.clipboard?.writeText(`${location.origin}/meet/${o.id}`); } catch {}
                                appendAdminNotification({ type: 'message', title: 'Meeting link copied', description: 'Invite link copied for a paid order.' });
                                setAdminNotifications(getAdminNotifications());
                              }}
                              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-default)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer' }}
                            >
                              Copy Invite
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {meetingRoom && meetingOrder && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 }}>
                <div style={{ width: '90%', height: '80%', background: 'var(--bg-primary)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>Voice Meeting — {meetingOrder.courseTitle}</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => { setMeetingRoom(null); setMeetingOrder(null); }} style={{ padding: '8px 12px' }}>Close</button>
                      <button onClick={() => {
                        const link = `https://meet.jit.si/${meetingRoom}`;
                        appendAdminNotification({ type: 'message', title: 'Meeting started', description: `Started meeting for ${meetingOrder.courseTitle}.` });
                        setAdminNotifications(getAdminNotifications());
                        try { navigator.clipboard?.writeText(link); } catch {}
                      }} style={{ padding: '8px 12px' }}>Notify (Copy Link)</button>
                    </div>
                  </div>
                  <div style={{ flex: 1, borderRadius: 8, overflow: 'hidden' }}>
                    <iframe src={`https://meet.jit.si/${meetingRoom}`} style={{ width: '100%', height: '100%', border: 0 }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Create Course Panel */}
        {activePanel === 'create-course' && (
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '30px' }}>Create New Course</h1>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '24px', color: 'var(--text-secondary)' }}>
              <p style={{ marginBottom: '18px' }}>Create a new course here. It will be saved to your managed course library and appear in Live Courses immediately.</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-primary)', fontWeight: '600' }}>Course Title</label>
                  <input
                    type="text"
                    value={courseDraft.title}
                    onChange={(e) => {
                      const nextTitle = e.target.value;
                      setCourseDraft((prev) => ({
                        ...prev,
                        title: nextTitle,
                        id: prev.id.trim() ? prev.id : normalizeCourseId(nextTitle),
                      }));
                      if (courseDraftStatus) setCourseDraftStatus('');
                    }}
                    placeholder="Build Modern Web Apps"
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-default)', background: 'var(--bg-card-alt)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-primary)', fontWeight: '600' }}>Course ID</label>
                  <input
                    type="text"
                    value={courseDraft.id}
                    onChange={(e) => {
                      setCourseDraft((prev) => ({ ...prev, id: e.target.value }));
                      if (courseDraftStatus) setCourseDraftStatus('');
                    }}
                    placeholder="build-modern-web-apps"
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-default)', background: 'var(--bg-card-alt)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-primary)', fontWeight: '600' }}>Icon</label>
                  <input
                    type="text"
                    value={courseDraft.icon}
                    onChange={(e) => setCourseDraft((prev) => ({ ...prev, icon: e.target.value }))}
                    placeholder="🎨"
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-default)', background: 'var(--bg-card-alt)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-primary)', fontWeight: '600' }}>Category</label>
                  <input
                    type="text"
                    value={courseDraft.tag}
                    onChange={(e) => setCourseDraft((prev) => ({ ...prev, tag: e.target.value }))}
                    placeholder="Development"
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-default)', background: 'var(--bg-card-alt)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-primary)', fontWeight: '600' }}>Level</label>
                  <select
                    value={courseDraft.level}
                    onChange={(e) => setCourseDraft((prev) => ({ ...prev, level: e.target.value as Course['level'] }))}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-default)', background: 'var(--bg-card-alt)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }}
                  >
                    <option value="BEGINNER">BEGINNER</option>
                    <option value="INTERMEDIATE">INTERMEDIATE</option>
                    <option value="ADVANCED">ADVANCED</option>
                    <option value="EXPERT">EXPERT</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-primary)', fontWeight: '600' }}>Accent</label>
                  <select
                    value={courseDraft.accent}
                    onChange={(e) => setCourseDraft((prev) => ({ ...prev, accent: e.target.value as Course['accent'] }))}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-default)', background: 'var(--bg-card-alt)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }}
                  >
                    <option value="gold">gold</option>
                    <option value="teal">teal</option>
                    <option value="violet">violet</option>
                    <option value="rose">rose</option>
                    <option value="green">green</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-primary)', fontWeight: '600' }}>Price</label>
                  <input
                    type="text"
                    value={courseDraft.price}
                    onChange={(e) => setCourseDraft((prev) => ({ ...prev, price: e.target.value }))}
                    placeholder="$49"
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-default)', background: 'var(--bg-card-alt)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-primary)', fontWeight: '600' }}>Old Price</label>
                  <input
                    type="text"
                    value={courseDraft.oldPrice}
                    onChange={(e) => setCourseDraft((prev) => ({ ...prev, oldPrice: e.target.value }))}
                    placeholder="$99"
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-default)', background: 'var(--bg-card-alt)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-primary)', fontWeight: '600' }}>Duration</label>
                  <input
                    type="text"
                    value={courseDraft.duration}
                    onChange={(e) => setCourseDraft((prev) => ({ ...prev, duration: e.target.value }))}
                    placeholder="12h"
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-default)', background: 'var(--bg-card-alt)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-primary)', fontWeight: '600' }}>Instructor</label>
                  <input
                    type="text"
                    value={courseDraft.byline}
                    onChange={(e) => setCourseDraft((prev) => ({ ...prev, byline: e.target.value }))}
                    placeholder="by SkillForge Instructor"
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-default)', background: 'var(--bg-card-alt)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-primary)', fontWeight: '600' }}>Promo Video URL</label>
                <input
                  type="text"
                  value={courseDraft.videoUrl}
                  onChange={(e) => setCourseDraft((prev) => ({ ...prev, videoUrl: e.target.value }))}
                  placeholder="https://www.youtube.com/watch?v=..."
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-default)', background: 'var(--bg-card-alt)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-primary)', fontWeight: '600' }}>Short Description</label>
                <textarea
                  value={courseDraft.description}
                  onChange={(e) => setCourseDraft((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Write a short course summary..."
                  rows={4}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-default)', background: 'var(--bg-card-alt)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  onClick={handleCreateCourse}
                  style={{
                    padding: '10px 16px',
                    background: 'var(--gold)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'var(--text-inverse)',
                    cursor: 'pointer',
                    fontWeight: '700',
                  }}
                >
                  Create Course
                </button>
                <button
                  onClick={resetCourseDraft}
                  type="button"
                  style={{
                    padding: '10px 16px',
                    background: 'transparent',
                    border: '1px solid var(--border-default)',
                    borderRadius: '8px',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontWeight: '600',
                  }}
                >
                  Reset
                </button>
              </div>

              {courseDraftStatus && (
                <p style={{ marginTop: '12px', color: courseDraftStatus.includes('successfully') ? 'var(--teal)' : 'var(--danger)', fontSize: '13px' }}>
                  {courseDraftStatus}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Live Courses Panel */}
        {activePanel === 'live-courses' && (
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '30px' }}>Live Courses</h1>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '24px', color: 'var(--text-secondary)' }}>
              <p style={{ marginBottom: '16px' }}>Manage courses and videos. You can add, edit, or remove courses and their YouTube links.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {managedCourses.map((course, index) => (
                  <div key={course.id} style={{ border: '1px solid var(--border-default)', borderRadius: '10px', padding: '12px', background: 'var(--bg-card-alt)' }}>
                    <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '20px' }}>{course.icon}</span>
                        <strong style={{ color: 'var(--text-primary)', fontSize: '14px' }}>{index + 1}. {course.title}</strong>
                      </div>
                      <button
                        onClick={() => removeManagedCourse(index)}
                        style={{
                          background: 'transparent',
                          border: '1px solid var(--border-default)',
                          color: 'var(--text-secondary)',
                          borderRadius: '8px',
                          padding: '5px 10px',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        Remove
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                      <input
                        type="text"
                        value={course.title}
                        onChange={(e) => updateManagedCourseField(index, 'title', e.target.value)}
                        placeholder="Course title"
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-default)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }}
                      />
                      <input
                        type="text"
                        value={course.id}
                        onChange={(e) => updateManagedCourseField(index, 'id', e.target.value)}
                        placeholder="course-id"
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-default)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                      <input
                        type="text"
                        value={course.icon}
                        onChange={(e) => updateManagedCourseField(index, 'icon', e.target.value)}
                        placeholder="Icon"
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-default)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }}
                      />
                      <input
                        type="text"
                        value={course.tag}
                        onChange={(e) => updateManagedCourseField(index, 'tag', e.target.value)}
                        placeholder="Tag"
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-default)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }}
                      />
                      <input
                        type="text"
                        value={course.duration}
                        onChange={(e) => updateManagedCourseField(index, 'duration', e.target.value)}
                        placeholder="Duration"
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-default)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                      <input
                        type="text"
                        value={course.price}
                        onChange={(e) => updateManagedCourseField(index, 'price', e.target.value)}
                        placeholder="$49"
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-default)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }}
                      />
                      <input
                        type="text"
                        value={course.oldPrice}
                        onChange={(e) => updateManagedCourseField(index, 'oldPrice', e.target.value)}
                        placeholder="$99"
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-default)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }}
                      />
                    </div>

                    <input
                      type="text"
                      value={course.videoUrl}
                      onChange={(e) => updateManagedCourseField(index, 'videoUrl', e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-default)',
                        background: 'var(--bg-surface)',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        outline: 'none',
                      }}
                    />
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
                <button
                  onClick={addManagedCourse}
                  style={{
                    padding: '10px 16px',
                    background: 'transparent',
                    border: '1px solid var(--border-default)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontWeight: '600',
                  }}
                >
                  + Add Course
                </button>
                <button
                  onClick={saveManagedCoursesItems}
                  style={{
                    padding: '10px 16px',
                    background: 'var(--gold)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'var(--text-inverse)',
                    cursor: 'pointer',
                    fontWeight: '700',
                  }}
                >
                  Save Courses
                </button>
                <button
                  onClick={resetManagedCoursesItems}
                  style={{
                    padding: '10px 16px',
                    background: 'transparent',
                    border: '1px solid var(--border-default)',
                    borderRadius: '8px',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontWeight: '600',
                  }}
                >
                  Reset Default
                </button>
              </div>

              {managedCoursesStatus && (
                <p style={{ marginTop: '12px', color: managedCoursesStatus.includes('successfully') ? 'var(--teal)' : 'var(--danger)', fontSize: '13px' }}>
                  {managedCoursesStatus}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Hero Panel */}
        {activePanel === 'hero' && (
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '30px' }}>Hero Section</h1>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '24px', color: 'var(--text-secondary)' }}>
              <p style={{ marginBottom: '16px' }}>Update the right-side image of the homepage hero card using an image URL.</p>

              <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', color: 'var(--text-primary)', fontWeight: '600' }}>Hero Image URL</label>
              <input
                type="text"
                value={heroImageInput}
                onChange={(e) => {
                  setHeroImageInput(e.target.value);
                  if (heroStatus) setHeroStatus('');
                }}
                placeholder="https://example.com/hero-image.jpg"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-default)',
                  background: 'var(--bg-card-alt)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  marginBottom: '12px',
                }}
              />

              <div style={{ border: '1px solid var(--border-default)', borderRadius: '10px', overflow: 'hidden', height: '180px', marginBottom: '14px', background: 'var(--bg-card-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {heroImageInput.trim() ? (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      backgroundImage: `url(${heroImageInput.trim()})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                    }}
                  />
                ) : (
                  <span style={{ fontSize: '48px' }}>🤖</span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  onClick={saveHeroImage}
                  style={{
                    padding: '10px 16px',
                    background: 'var(--gold)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'var(--text-inverse)',
                    cursor: 'pointer',
                    fontWeight: '700',
                  }}
                >
                  Save Hero Image
                </button>
                <button
                  onClick={resetHeroImage}
                  style={{
                    padding: '10px 16px',
                    background: 'transparent',
                    border: '1px solid var(--border-default)',
                    borderRadius: '8px',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontWeight: '600',
                  }}
                >
                  Reset Default
                </button>
              </div>

              {heroStatus && (
                <p style={{ marginTop: '12px', color: heroStatus.includes('successfully') ? 'var(--teal)' : 'var(--text-secondary)', fontSize: '13px' }}>
                  {heroStatus}
                </p>
              )}
            </div>
          </div>
        )}

        {/* FAQ Panel */}
        {activePanel === 'faq' && (
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '30px' }}>FAQ Management</h1>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '24px', color: 'var(--text-secondary)' }}>
              <p style={{ marginBottom: '20px' }}>Edit homepage FAQ questions and answers. Click save to publish instantly on the landing page.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {faqItems.map((item, index) => (
                  <div key={index} style={{ border: '1px solid var(--border-default)', borderRadius: '10px', padding: '14px', background: 'var(--bg-card-alt)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <strong style={{ color: 'var(--text-primary)', fontSize: '13px' }}>FAQ #{index + 1}</strong>
                      <button
                        onClick={() => removeFaqItem(index)}
                        style={{
                          background: 'transparent',
                          border: '1px solid var(--border-default)',
                          color: 'var(--text-secondary)',
                          borderRadius: '8px',
                          padding: '5px 10px',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        Remove
                      </button>
                    </div>

                    <input
                      type="text"
                      value={item.q}
                      onChange={(e) => updateFaqItem(index, 'q', e.target.value)}
                      placeholder="Question"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-default)',
                        background: 'var(--bg-surface)',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        marginBottom: '10px',
                        outline: 'none',
                      }}
                    />

                    <textarea
                      value={item.a}
                      onChange={(e) => updateFaqItem(index, 'a', e.target.value)}
                      placeholder="Answer"
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-default)',
                        background: 'var(--bg-surface)',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        resize: 'vertical',
                        outline: 'none',
                        fontFamily: 'var(--font-body)',
                      }}
                    />
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
                <button
                  onClick={addFaqItem}
                  style={{
                    padding: '10px 16px',
                    background: 'transparent',
                    border: '1px solid var(--border-default)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontWeight: '600',
                  }}
                >
                  + Add FAQ
                </button>
                <button
                  onClick={saveFaqItems}
                  style={{
                    padding: '10px 16px',
                    background: 'var(--gold)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'var(--text-inverse)',
                    cursor: 'pointer',
                    fontWeight: '700',
                  }}
                >
                  Save FAQ
                </button>
                <button
                  onClick={resetFaqItems}
                  style={{
                    padding: '10px 16px',
                    background: 'transparent',
                    border: '1px solid var(--border-default)',
                    borderRadius: '8px',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontWeight: '600',
                  }}
                >
                  Reset Default
                </button>
              </div>

              {faqStatus && (
                <p style={{ marginTop: '12px', color: faqStatus.includes('successfully') ? 'var(--teal)' : 'var(--danger)', fontSize: '13px' }}>
                  {faqStatus}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Categories Panel */}
        {activePanel === 'categories' && (
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '30px' }}>Categories</h1>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '24px', color: 'var(--text-secondary)' }}>
              <p style={{ marginBottom: '20px' }}>Edit homepage category cards (label, icon, and pill color).</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {categoriesItems.map((item, index) => (
                  <div key={item.id || index} style={{ border: '1px solid var(--border-default)', borderRadius: '10px', padding: '14px', background: 'var(--bg-card-alt)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <strong style={{ color: 'var(--text-primary)', fontSize: '13px' }}>Category #{index + 1}</strong>
                      <button
                        onClick={() => removeCategoryItem(index)}
                        style={{
                          background: 'transparent',
                          border: '1px solid var(--border-default)',
                          color: 'var(--text-secondary)',
                          borderRadius: '8px',
                          padding: '5px 10px',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        Remove
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 0.8fr 1fr', gap: '10px' }}>
                      <input
                        type="text"
                        value={item.label}
                        onChange={(e) => updateCategoryItem(index, 'label', e.target.value)}
                        placeholder="Category label"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-default)',
                          background: 'var(--bg-surface)',
                          color: 'var(--text-primary)',
                          fontSize: '14px',
                          outline: 'none',
                        }}
                      />

                      <input
                        type="text"
                        value={item.icon}
                        onChange={(e) => updateCategoryItem(index, 'icon', e.target.value)}
                        placeholder="Icon"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-default)',
                          background: 'var(--bg-surface)',
                          color: 'var(--text-primary)',
                          fontSize: '14px',
                          outline: 'none',
                        }}
                      />

                      <select
                        value={item.pill}
                        onChange={(e) => updateCategoryItem(index, 'pill', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-default)',
                          background: 'var(--bg-surface)',
                          color: 'var(--text-primary)',
                          fontSize: '14px',
                          outline: 'none',
                        }}
                      >
                        <option value="pill-gold">Gold</option>
                        <option value="pill-teal">Teal</option>
                        <option value="pill-violet">Violet</option>
                        <option value="pill-rose">Rose</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
                <button
                  onClick={addCategoryItem}
                  style={{
                    padding: '10px 16px',
                    background: 'transparent',
                    border: '1px solid var(--border-default)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontWeight: '600',
                  }}
                >
                  + Add Category
                </button>
                <button
                  onClick={saveCategoriesItems}
                  style={{
                    padding: '10px 16px',
                    background: 'var(--gold)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'var(--text-inverse)',
                    cursor: 'pointer',
                    fontWeight: '700',
                  }}
                >
                  Save Categories
                </button>
                <button
                  onClick={resetCategoriesItems}
                  style={{
                    padding: '10px 16px',
                    background: 'transparent',
                    border: '1px solid var(--border-default)',
                    borderRadius: '8px',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontWeight: '600',
                  }}
                >
                  Reset Default
                </button>
              </div>

              {categoriesStatus && (
                <p style={{ marginTop: '12px', color: categoriesStatus.includes('successfully') ? 'var(--teal)' : 'var(--danger)', fontSize: '13px' }}>
                  {categoriesStatus}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Manage Team Panel */}
        {activePanel === 'manage-team' && (
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '30px' }}>Manage Team</h1>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '24px', color: 'var(--text-secondary)' }}>
              <p style={{ marginBottom: '16px' }}>Promote members to admin or demote them back to user. This uses the logged-in users list and updates roles immediately.</p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px', marginBottom: '18px' }}>
                <div style={{ border: '1px solid var(--border-default)', borderRadius: '10px', padding: '14px', background: 'var(--bg-card-alt)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Total members</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>{loggedInUsers.length}</div>
                </div>
                <div style={{ border: '1px solid var(--border-default)', borderRadius: '10px', padding: '14px', background: 'var(--bg-card-alt)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Admins</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--gold)' }}>{loggedInUsers.filter((member) => member.role === 'admin').length}</div>
                </div>
                <div style={{ border: '1px solid var(--border-default)', borderRadius: '10px', padding: '14px', background: 'var(--bg-card-alt)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Active users</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--teal)' }}>{loggedInUsers.filter((member) => member.role === 'user').length}</div>
                </div>
              </div>

              {teamStatus && (
                <p style={{ marginBottom: '14px', color: teamStatus.includes('updated') ? 'var(--teal)' : 'var(--danger)', fontSize: '13px' }}>
                  {teamStatus}
                </p>
              )}

              {usersLoading ? (
                <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Loading team members…</div>
              ) : loggedInUsers.length === 0 ? (
                <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>No team members available yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {loggedInUsers.map((member) => {
                    const isAdmin = member.role === 'admin';

                    return (
                      <div key={member.id} style={{ border: '1px solid var(--border-default)', borderRadius: '10px', padding: '14px', background: 'var(--bg-card-alt)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: isAdmin ? 'var(--gold-dim)' : 'var(--teal-dim)', color: isAdmin ? 'var(--gold)' : 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                            {member.initials?.slice(0, 2) || member.name?.slice(0, 2).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{member.name}</div>
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{member.email}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{member.authProvider} · {member.loginCount} logins</div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ padding: '6px 10px', borderRadius: '999px', border: '1px solid var(--border-default)', color: isAdmin ? 'var(--gold)' : 'var(--text-secondary)', fontSize: '12px', fontWeight: 700 }}>
                            {member.role.toUpperCase()}
                          </span>

                          {member.id === user?.id ? (
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Current admin</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => updateTeamRole(member.id, isAdmin ? 'user' : 'admin')}
                              style={{
                                background: isAdmin ? 'transparent' : 'var(--gold)',
                                border: isAdmin ? '1px solid var(--border-default)' : 'none',
                                color: isAdmin ? 'var(--text-secondary)' : 'var(--text-inverse)',
                                borderRadius: '8px',
                                padding: '7px 12px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                fontWeight: 700,
                              }}
                            >
                              {isAdmin ? 'Demote to User' : 'Promote to Admin'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Courses Analytics Panel */}
        {activePanel === 'courses-analytics' && (
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '30px' }}>Courses Analytics</h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              {[
                { label: 'Total Courses', value: coursesAnalytics.totalCourses.toString(), hint: 'Managed course catalog', color: 'var(--gold)' },
                { label: 'Active Courses', value: coursesAnalytics.activeCourses.toString(), hint: 'Courses with video URLs', color: 'var(--teal)' },
                { label: 'Paid Orders', value: coursesAnalytics.totalOrders.toString(), hint: 'Real confirmed purchases', color: 'var(--violet)' },
                { label: 'Revenue', value: `$${coursesAnalytics.totalRevenue.toFixed(0)}`, hint: 'From paid orders', color: 'var(--green)' },
              ].map((stat) => (
                <div key={stat.label} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '20px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{stat.label}</div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: stat.color, marginBottom: '6px' }}>{stat.value}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{stat.hint}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px', marginBottom: '20px' }}>
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Course Performance</h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Revenue and sales by course</span>
                </div>

                {coursesAnalytics.courseStats.length === 0 ? (
                  <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>No courses available yet.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {coursesAnalytics.courseStats.slice(0, 6).map((course, index) => {
                      const maxRevenue = Math.max(...coursesAnalytics.courseStats.map((item) => item.revenue), 1);
                      const width = `${Math.max((course.revenue / maxRevenue) * 100, course.sales > 0 ? 12 : 4)}%`;

                      return (
                        <div key={course.id} style={{ border: '1px solid var(--border-default)', borderRadius: '10px', padding: '14px', background: 'var(--bg-card-alt)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>{index + 1}. {course.title}</div>
                              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{course.tag} · {course.level} · {course.duration}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gold)' }}>{course.sales} sales</div>
                              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>${course.revenue.toFixed(0)} revenue</div>
                            </div>
                          </div>
                          <div style={{ height: '10px', borderRadius: '999px', background: 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                            <div style={{ width, height: '100%', borderRadius: '999px', background: 'linear-gradient(90deg, var(--gold), var(--teal))' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>Top Category</h3>
                  {coursesAnalytics.topCategories.length === 0 ? (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>No category data yet.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {coursesAnalytics.topCategories.slice(0, 4).map((category) => (
                        <div key={category.tag} style={{ border: '1px solid var(--border-default)', borderRadius: '10px', padding: '12px', background: 'var(--bg-card-alt)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginBottom: '6px' }}>
                            <strong style={{ color: 'var(--text-primary)', fontSize: '14px' }}>{category.tag}</strong>
                            <span style={{ color: 'var(--gold)', fontSize: '13px', fontWeight: 700 }}>${category.revenue.toFixed(0)}</span>
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{category.courses} courses · {category.sales} sales</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>Best Performing Course</h3>
                  {coursesAnalytics.topCourse ? (
                    <div style={{ border: '1px solid var(--border-default)', borderRadius: '10px', padding: '14px', background: 'var(--bg-card-alt)' }}>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>{coursesAnalytics.topCourse.title}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>{coursesAnalytics.topCourse.tag} · {coursesAnalytics.topCourse.level}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '13px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{coursesAnalytics.topCourse.sales} sales</span>
                        <span style={{ color: 'var(--gold)', fontWeight: 700 }}>${coursesAnalytics.topCourse.revenue.toFixed(0)} revenue</span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>No sales yet.</div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>Recent Paid Orders</h3>
                {coursesAnalytics.recentOrders.length === 0 ? (
                  <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>No paid orders found.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {coursesAnalytics.recentOrders.map((order) => (
                      <div key={order.id} style={{ border: '1px solid var(--border-default)', borderRadius: '10px', padding: '12px', background: 'var(--bg-card-alt)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginBottom: '6px' }}>
                          <strong style={{ color: 'var(--text-primary)', fontSize: '14px' }}>{order.courseTitle}</strong>
                          <span style={{ color: 'var(--gold)', fontSize: '13px', fontWeight: 700 }}>{order.amount}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{order.buyerEmail}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{new Date(order.createdAt).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>Catalog Snapshot</h3>
                <div style={{ display: 'grid', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <span>Average course price</span>
                    <strong style={{ color: 'var(--text-primary)' }}>${coursesAnalytics.avgCoursePrice.toFixed(0)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <span>Tracked catalog size</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{coursesAnalytics.catalogCoverage}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <span>Revenue per course</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{coursesAnalytics.totalCourses > 0 ? `$${(coursesAnalytics.totalRevenue / coursesAnalytics.totalCourses).toFixed(0)}` : '$0'}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
