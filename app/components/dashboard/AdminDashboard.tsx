'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { type Course } from '@/app/lib/courses-data';
import { DEFAULT_FAQS, FAQ_STORAGE_KEY, type FaqItem } from '@/app/lib/faq-data';
import { DEFAULT_HERO_IMAGE_URL, HERO_IMAGE_STORAGE_KEY } from '@/app/lib/hero-data';
import { CATEGORIES_STORAGE_KEY, DEFAULT_CATEGORIES, type CategoryItem } from '@/app/lib/categories-data';
import { getInitialUserAdminChat, saveUserAdminChat, subscribeUserAdminChat, type UserAdminChatMessage } from '@/app/lib/user-admin-chat';
import { getDefaultManagedCourses, getManagedCoursesClient, resetManagedCourses, saveManagedCourses } from '@/app/lib/managed-courses-data';
import { clearAllAdminNotifications, deleteAdminNotification, getAdminNotifications, markAllAdminNotificationsRead, subscribeAdminNotifications, type AdminNotification } from '@/app/lib/admin-notifications';

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
  const [adminNotifications, setAdminNotifications] = useState<AdminNotification[]>(getAdminNotifications);
  const [showNotifications, setShowNotifications] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const notificationPanelRef = useRef<HTMLDivElement>(null);
  const prevUnreadNotificationsRef = useRef(0);
  const notificationInitDoneRef = useRef(false);
  const interfaceStartSoundPlayedRef = useRef(false);

  useEffect(() => {
    if (!user || user.role !== 'admin') router.replace('/dashboard');
  }, [user, router]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMsgs]);

  useEffect(() => subscribeUserAdminChat(() => setChatMsgs(getInitialUserAdminChat())), []);
  useEffect(() => subscribeAdminNotifications(() => setAdminNotifications(getAdminNotifications())), []);

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
                      onClick={handleDeleteAllNotifications}
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
              {[
                { label: 'Active Users', value: '4,832', change: '+24%', icon: '👥', color: 'var(--teal)' },
                { label: 'Total Courses', value: '1,247', change: '+12%', icon: '📚', color: 'var(--gold)' },
                { label: 'Revenue', value: '$45.2K', change: '+42%', icon: '💰', color: 'var(--green)' },
                { label: 'Conversion', value: '3.24%', change: '+8%', icon: '📈', color: 'var(--violet)' },
              ].map((stat, i) => (
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
              {/* Users Analytics */}
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '20px' }}>
                  Users Analytics
                </h3>
                <div style={{ position: 'relative', height: '180px', background: 'linear-gradient(to top, var(--teal-dim), transparent)', borderRadius: '8px', padding: '20px', display: 'flex', alignItems: 'flex-end', gap: '4px' }}>
                  {[12, 19, 8, 15, 22, 18, 25, 28, 30, 26, 32, 38].map((val, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: `${(val / 40) * 100}%`,
                        background: `linear-gradient(to top, var(--teal), rgba(20, 184, 166, 0.6))`,
                        borderRadius: '4px 4px 0 0',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '0.7';
                        e.currentTarget.style.transform = 'scaleY(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '1';
                        e.currentTarget.style.transform = 'scaleY(1)';
                      }}
                    />
                  ))}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '12px', textAlign: 'center' }}>
                  Last 12 months
                </div>
              </div>

              {/* Orders Analytics */}
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '20px' }}>
                  Orders Analytics
                </h3>
                <div style={{ position: 'relative', height: '180px', display: 'flex', alignItems: 'flex-end', gap: '8px', padding: '20px' }}>
                  {[8, 12, 5, 14, 18, 22, 19, 25, 28, 32, 35, 38].map((val, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: `${(val / 40) * 100}%`,
                        background: `linear-gradient(to top, var(--gold), rgba(251, 146, 60, 0.6))`,
                        borderRadius: '4px',
                        border: '1px solid rgba(251, 146, 60, 0.3)',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(to top, var(--gold), var(--gold))';
                        e.currentTarget.style.transform = 'scaleY(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = `linear-gradient(to top, var(--gold), rgba(251, 146, 60, 0.6))`;
                        e.currentTarget.style.transform = 'scaleY(1)';
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '20px' }}>
                Recent Transactions
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600' }}>ID</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600' }}>Name</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600' }}>Price</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600' }}>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { id: '#64954...', name: 'Shahdat Hosain', price: '$24.99', created: '23 hours ago' },
                    { id: '#64934b...', name: 'Shahdat Sajeeb', price: '$24.99', created: '23 hours ago' },
                    { id: '#64934a...', name: 'John Doe', price: '$24.99', created: '1 day ago' },
                  ].map((txn, i) => (
                    <tr key={i} style={{ borderBottom: i < 2 ? '1px solid var(--border-default)' : 'none', transition: 'all 0.2s ease' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--gold-dim)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                      <td style={{ padding: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>{txn.id}</td>
                      <td style={{ padding: '12px', fontSize: '14px', color: 'var(--text-primary)', fontWeight: '500' }}>{txn.name}</td>
                      <td style={{ padding: '12px', fontSize: '14px', color: 'var(--gold)', fontWeight: '600' }}>{txn.price}</td>
                      <td style={{ padding: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>{txn.created}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <p>Invoice management features coming soon</p>
            </div>
          </div>
        )}

        {/* Create Course Panel */}
        {activePanel === 'create-course' && (
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '30px' }}>Create New Course</h1>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <p>Course creation form coming soon</p>
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
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <p>Team management features coming soon</p>
            </div>
          </div>
        )}

        {/* Courses Analytics Panel */}
        {activePanel === 'courses-analytics' && (
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '30px' }}>Courses Analytics</h1>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <p>Courses analytics and statistics coming soon</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
