export type UserAdminChatRole = 'user' | 'admin';

export interface UserAdminChatMessage {
  id: string;
  senderRole: UserAdminChatRole;
  senderName: string;
  text: string;
  createdAt: number;
}

export const USER_ADMIN_CHAT_STORAGE_KEY = 'skillforge_user_admin_chat_messages';
export const USER_ADMIN_CHAT_EVENT = 'skillforge-user-admin-chat-updated';

const DEFAULT_MESSAGES: UserAdminChatMessage[] = [
  {
    id: 'welcome-admin-chat',
    senderRole: 'admin',
    senderName: 'Admin Team',
    text: 'Welcome to support chat. Send your question and an admin will reply here.',
    createdAt: 1,
  },
];

export const sanitizeUserAdminChat = (messages: UserAdminChatMessage[]): UserAdminChatMessage[] => {
  if (!Array.isArray(messages) || messages.length === 0) return DEFAULT_MESSAGES;

  const normalized: UserAdminChatMessage[] = messages
    .map((item, index) => ({
      id: item.id?.trim() || `msg-${index + 1}`,
      senderRole: (item.senderRole === 'admin' ? 'admin' : 'user') as UserAdminChatRole,
      senderName: item.senderName?.trim() || (item.senderRole === 'admin' ? 'Admin' : 'User'),
      text: item.text?.trim() || '',
      createdAt: typeof item.createdAt === 'number' ? item.createdAt : Date.now(),
    }))
    .filter((item) => item.text);

  return normalized.length > 0 ? normalized : DEFAULT_MESSAGES;
};

export const getInitialUserAdminChat = (): UserAdminChatMessage[] => {
  if (typeof window === 'undefined') return DEFAULT_MESSAGES;

  const stored = window.localStorage.getItem(USER_ADMIN_CHAT_STORAGE_KEY);
  if (!stored) return DEFAULT_MESSAGES;

  try {
    return sanitizeUserAdminChat(JSON.parse(stored) as UserAdminChatMessage[]);
  } catch {
    return DEFAULT_MESSAGES;
  }
};

export const saveUserAdminChat = (messages: UserAdminChatMessage[]) => {
  const normalized = sanitizeUserAdminChat(messages);
  window.localStorage.setItem(USER_ADMIN_CHAT_STORAGE_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new Event(USER_ADMIN_CHAT_EVENT));
  return normalized;
};

export const subscribeUserAdminChat = (callback: () => void) => {
  const onStorage = (event: StorageEvent) => {
    if (event.key === USER_ADMIN_CHAT_STORAGE_KEY) callback();
  };
  const onLocalUpdate = () => callback();

  window.addEventListener('storage', onStorage);
  window.addEventListener(USER_ADMIN_CHAT_EVENT, onLocalUpdate);

  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(USER_ADMIN_CHAT_EVENT, onLocalUpdate);
  };
};
