import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

import { getInitials, upsertOAuthUser, verifyUserCredentials, type AppRole } from "@/app/lib/auth-users";
import { connectMongoose } from "@/app/lib/mongoose";
import { UserModel } from "@/app/lib/models/User";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

type UserWithAppFields = {
  id?: string;
  role?: AppRole;
  initials?: string;
};

const isGoogleConfigured = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
);

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },

  providers: [
    ...(isGoogleConfigured
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
          }),
        ]
      : []),

    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const role =
          credentials.role === "admin" || credentials.role === "user"
            ? (credentials.role as AppRole)
            : undefined;

        const user = await verifyUserCredentials(
          credentials.email.toString(),
          credentials.password.toString(),
          role
        );

        if (!user) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          initials: user.initials ?? getInitials(user.name),
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      if (!process.env.MONGODB_URI) return true;

      try {
        await connectMongoose();

        if (account?.provider === "google") {
          const dbUser = await upsertOAuthUser({
            name: user.name,
            email: user.email,
            role: "user",
          });

          if (dbUser) {
            const appUser = user as typeof user & UserWithAppFields;
            appUser.id = dbUser.id;
            appUser.role = dbUser.role;
            appUser.initials = dbUser.initials;
          }
        }

        if (user.email) {
          await UserModel.updateOne(
            { email: normalizeEmail(user.email) },
            {
              $set: {
                lastLoginAt: new Date(),
                lastLoginProvider: account?.provider ?? "unknown",
              },
              $inc: { loginCount: 1 },
            }
          );

          try {
            // Record a login event for complete timeline/history
            const { LoginEventModel } = await import("@/app/lib/models/LoginEvent");
            await LoginEventModel.create({
              userId: (user as any).id ?? "",
              email: normalizeEmail(user.email),
              provider: account?.provider ?? "unknown",
            });
          } catch {
            // ignore login event errors
          }
        }
      } catch {
        // Do not block login if analytics write fails.
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        const appUser = user as typeof user & UserWithAppFields;
        token.id = appUser.id;
        token.role = appUser.role ?? "user";
        token.initials = appUser.initials ?? "U";
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as AppRole;
        session.user.initials = token.initials as string;
      }
      return session;
    },
  },

  pages: { signIn: "/login" },
};