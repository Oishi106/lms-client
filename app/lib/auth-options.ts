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

type UserIdCarrier = {
  id?: string;
};

const isGoogleConfigured = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
);

export const authOptions: NextAuthOptions = {
  // ১. সেশন স্ট্র্যাটেজি এবং সিক্রেট নিশ্চিত করা
  session: { 
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // ৩০ দিন
  },
  secret: process.env.NEXTAUTH_SECRET,

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

        // ডেটাবেস কানেকশন নিশ্চিত করা
        await connectMongoose();

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
    async signIn({ user, account }) {
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
          const email = normalizeEmail(user.email);
          await UserModel.updateOne(
            { email },
            {
              $set: {
                lastLoginAt: new Date(),
                lastLoginProvider: account?.provider ?? "unknown",
              },
              $inc: { loginCount: 1 },
            }
          );

          try {
            const { LoginEventModel } = await import("@/app/lib/models/LoginEvent");
            const appUser = user as typeof user & UserIdCarrier;
            await LoginEventModel.create({
              userId: appUser.id ?? "",
              email: email,
              provider: account?.provider ?? "unknown",
            });
          } catch (e) {
            console.error("Login event error:", e);
          }
        }
      } catch (error) {
        console.error("SignIn Callback Error:", error);
      }

      return true;
    },

    async jwt({ token, user, trigger, session }) {
      // সেশন আপডেট সাপোর্ট করার জন্য
      if (trigger === "update" && session) {
        return { ...token, ...session.user };
      }

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

  pages: { 
    signIn: "/login",
    error: "/login", // এরর হলেও লগইন পেজে রাখবে
  },
  
  // ডেপ্লয়মেন্টের জন্য সিকিউরিটি কুকি কনফিগারেশন (অপশনাল কিন্তু ভালো)
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" ? `__Secure-next-auth.session-token` : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
};