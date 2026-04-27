export interface UserNotification {
  id: string;
  type: 'message' | 'system';
  title: string;
  description: string;
  createdAt: number;
  read: boolean;
}

export const USER_NOTIFICATIONS_STORAGE_KEY = 'skillforge_user_notifications';
export const USER_NOTIFICATIONS_UPDATED_EVENT = 'skillforge-user-notifications-updated';

const MAX_NOTIFICATIONS = 60;

const sortNotifications = (items: UserNotification[]) => [...items].sort((a, b) => b.createdAt - a.createdAt);

export const getUserNotifications = (): UserNotification[] => {
  if (typeof window === 'undefined') return [];

  const raw = window.localStorage.getItem(USER_NOTIFICATIONS_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as UserNotification[];
    if (!Array.isArray(parsed)) return [];

    const valid: UserNotification[] = parsed
      .map((item, index) => ({
        id: item.id?.trim() || `un-${index + 1}`,
        type: item.type === 'message' ? 'message' : 'system',
        title: item.title?.trim() || 'Notification',
        description: item.description?.trim() || '',
        createdAt: typeof item.createdAt === 'number' ? item.createdAt : Date.now(),
        read: Boolean(item.read),
      }))
      .filter((item) => item.title || item.description)
      .slice(0, MAX_NOTIFICATIONS);

    return sortNotifications(valid);
  } catch {
    return [];
  }
};

const saveNotifications = (items: UserNotification[]) => {
  const next = sortNotifications(items).slice(0, MAX_NOTIFICATIONS);
  window.localStorage.setItem(USER_NOTIFICATIONS_STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(USER_NOTIFICATIONS_UPDATED_EVENT));
  return next;
};

export const appendUserNotification = (input: Omit<UserNotification, 'id' | 'createdAt' | 'read'>) => {
  const nextItem: UserNotification = {
    id: `un-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: input.type,
    title: input.title,
    description: input.description,
    createdAt: Date.now(),
    read: false,
  };

  const current = getUserNotifications();
  return saveNotifications([nextItem, ...current]);
};

export const markAllUserNotificationsRead = () => {
  const current = getUserNotifications();
  return saveNotifications(current.map((item) => ({ ...item, read: true })));
};

export const deleteUserNotification = (id: string) => {
  const current = getUserNotifications();
  return saveNotifications(current.filter((item) => item.id !== id));
};

export const clearAllUserNotifications = () => saveNotifications([]);

export const subscribeUserNotifications = (callback: () => void) => {
  const onStorage = (event: StorageEvent) => {
    if (event.key === USER_NOTIFICATIONS_STORAGE_KEY) callback();
  };

  window.addEventListener('storage', onStorage);
  window.addEventListener(USER_NOTIFICATIONS_UPDATED_EVENT, callback);

  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(USER_NOTIFICATIONS_UPDATED_EVENT, callback);
  };
};