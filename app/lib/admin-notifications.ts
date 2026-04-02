export interface AdminNotification {
  id: string;
  type: 'payment' | 'message' | 'system';
  title: string;
  description: string;
  createdAt: number;
  read: boolean;
}

export const ADMIN_NOTIFICATIONS_STORAGE_KEY = 'skillforge_admin_notifications';
export const ADMIN_NOTIFICATIONS_UPDATED_EVENT = 'skillforge-admin-notifications-updated';

const MAX_NOTIFICATIONS = 60;

const sortNotifications = (items: AdminNotification[]) =>
  [...items].sort((a, b) => b.createdAt - a.createdAt);

export const getAdminNotifications = (): AdminNotification[] => {
  if (typeof window === 'undefined') return [];

  const raw = window.localStorage.getItem(ADMIN_NOTIFICATIONS_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as AdminNotification[];
    if (!Array.isArray(parsed)) return [];

    const valid: AdminNotification[] = parsed
      .map((item, index) => ({
        id: item.id?.trim() || `n-${index + 1}`,
        type: (item.type === 'payment' || item.type === 'message' ? item.type : 'system') as AdminNotification['type'],
        title: item.title?.trim() || 'Notification',
        description: item.description?.trim() || '',
        createdAt: typeof item.createdAt === 'number' ? item.createdAt : Date.now(),
        read: Boolean(item.read),
      }))
      .slice(0, MAX_NOTIFICATIONS);

    return sortNotifications(valid);
  } catch {
    return [];
  }
};

const saveNotifications = (items: AdminNotification[]) => {
  const next = sortNotifications(items).slice(0, MAX_NOTIFICATIONS);
  window.localStorage.setItem(ADMIN_NOTIFICATIONS_STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(ADMIN_NOTIFICATIONS_UPDATED_EVENT));
  return next;
};

export const appendAdminNotification = (input: Omit<AdminNotification, 'id' | 'createdAt' | 'read'>) => {
  const nextItem: AdminNotification = {
    id: `ntf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: input.type,
    title: input.title,
    description: input.description,
    createdAt: Date.now(),
    read: false,
  };

  const current = getAdminNotifications();
  return saveNotifications([nextItem, ...current]);
};

export const markAllAdminNotificationsRead = () => {
  const current = getAdminNotifications();
  const next = current.map((item) => ({ ...item, read: true }));
  return saveNotifications(next);
};

export const deleteAdminNotification = (id: string) => {
  const current = getAdminNotifications();
  const next = current.filter((item) => item.id !== id);
  return saveNotifications(next);
};

export const clearAllAdminNotifications = () => {
  return saveNotifications([]);
};

export const subscribeAdminNotifications = (callback: () => void) => {
  const onStorage = (event: StorageEvent) => {
    if (event.key === ADMIN_NOTIFICATIONS_STORAGE_KEY) callback();
  };

  window.addEventListener('storage', onStorage);
  window.addEventListener(ADMIN_NOTIFICATIONS_UPDATED_EVENT, callback);

  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(ADMIN_NOTIFICATIONS_UPDATED_EVENT, callback);
  };
};
