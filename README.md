# LMS Client (Next.js + TypeScript)

This project now uses `next-auth` for authentication with App Router.

## 1) Environment Setup

Copy `.env.example` to `.env.local` and set values:

```bash
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=replace-with-a-long-random-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

Generate a secure secret (example):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Notes:

- In `.env` files, `#` starts a comment unless the value is quoted. Prefer a hex secret, or wrap the value in quotes.
- If you change `NEXTAUTH_SECRET`, clear site cookies for `localhost:3000` once (old NextAuth session cookies can’t be decrypted).

## 2) Run App

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## 3) Auth Flow (Current)

- Auth provider: NextAuth Credentials provider
- Auth provider: NextAuth Credentials provider + Google OAuth
- Login page: `/login`
- Register page: `/register`
- Protected routes: `/dashboard/*`, `/checkout/*` via `middleware.ts`
- Session strategy: JWT

### Admin Bootstrapping

- The very first account that registers (in an empty DB) is automatically created as `admin`.
- After that, public signup cannot create new admins; an existing admin must promote users (not implemented yet).

### MongoDB

- All auth data is stored in MongoDB via `MONGODB_URI`.

## 4) Important Auth Files

- `app/api/auth/[...nextauth]/route.ts`: NextAuth route handler
- `app/lib/auth-options.ts`: NextAuth config (providers, callbacks, pages)
- `app/lib/auth-users.ts`: in-memory demo/register user store
- `app/api/auth/register/route.ts`: registration API used by UI
- `types/next-auth.d.ts`: session/jwt type augmentation
- `middleware.ts`: route protection
- `app/providers.tsx`: `SessionProvider` + theme provider

## 5) Notes

- Registration currently stores users in memory (good for local/dev demo).
- For production, connect a real database (Prisma/Mongo/Postgres) and hash passwords.
