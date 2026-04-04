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

### Demo Credentials

- Learner: `user@example.com` / `123456`
- Admin: `admin@example.com` / `123456`
- Google: requires `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

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
