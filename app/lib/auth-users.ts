export type AppRole = "user" | "admin";

export type AppUserRecord = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: AppRole;
  initials: string;
};

type PublicAppUser = Omit<AppUserRecord, "password">;

type RegisterPayload = {
  firstName: string;
  lastName?: string;
  email: string;
  password: string;
  role?: AppRole;
};

const DEMO_USERS: AppUserRecord[] = [
  {
    id: "demo-user-1",
    name: "Demo Learner",
    email: "user@example.com",
    password: "123456",
    role: "user",
    initials: "DL",
  },
  {
    id: "demo-admin-1",
    name: "Demo Admin",
    email: "admin@example.com",
    password: "123456",
    role: "admin",
    initials: "DA",
  },
];

const USER_STORE_KEY = "__skillforge_auth_users__";

function toInitials(name: string): string {
  const cleaned = name.trim();
  if (!cleaned) return "U";
  const parts = cleaned.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "U";
  const second = (parts[1]?.[0] ?? parts[0]?.[1] ?? "").toString();
  return (first + second).toUpperCase();
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return "U";
  return toInitials(name);
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function getUserStore(): Map<string, AppUserRecord> {
  const globalRef = globalThis as typeof globalThis & {
    [USER_STORE_KEY]?: Map<string, AppUserRecord>;
  };

  if (!globalRef[USER_STORE_KEY]) {
    const map = new Map<string, AppUserRecord>();
    DEMO_USERS.forEach((user) => {
      map.set(normalizeEmail(user.email), user);
    });
    globalRef[USER_STORE_KEY] = map;
  }

  return globalRef[USER_STORE_KEY];
}

function toPublicUser(user: AppUserRecord): PublicAppUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    initials: user.initials,
  };
}

export function getPublicUserByEmail(email: string): PublicAppUser | null {
  const user = getUserStore().get(normalizeEmail(email));
  return user ? toPublicUser(user) : null;
}

export function verifyUserCredentials(email: string, password: string, role?: AppRole): PublicAppUser | null {
  const user = getUserStore().get(normalizeEmail(email));
  if (!user) return null;
  if (user.password !== password) return null;
  if (role && user.role !== role) return null;
  return toPublicUser(user);
}

export function registerUser(payload: RegisterPayload):
  | { ok: true; user: PublicAppUser }
  | { ok: false; message: string } {
  const email = normalizeEmail(payload.email);
  if (!email) return { ok: false, message: "Email is required." };
  if (payload.password.length < 6) return { ok: false, message: "Password must be at least 6 characters." };

  const store = getUserStore();
  if (store.has(email)) {
    return { ok: false, message: "An account already exists with this email." };
  }

  const firstName = payload.firstName.trim();
  const lastName = (payload.lastName ?? "").trim();
  const fullName = [firstName, lastName].filter(Boolean).join(" ");

  if (!fullName) {
    return { ok: false, message: "Name is required." };
  }

  const nextUser: AppUserRecord = {
    id: `usr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: fullName,
    email,
    password: payload.password,
    role: payload.role ?? "user",
    initials: toInitials(fullName),
  };

  store.set(email, nextUser);
  return { ok: true, user: toPublicUser(nextUser) };
}
