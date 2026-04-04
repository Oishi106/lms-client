import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

import type { AppRole } from "@/app/lib/auth-users";
import { getInitials, verifyUserCredentials } from "@/app/lib/auth-users";

const isGoogleConfigured = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
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
        const email = credentials?.email?.toString().trim() ?? "";
        const password = credentials?.password?.toString() ?? "";
        const roleInput = credentials?.role?.toString() ?? "";
        const role = roleInput === "admin" || roleInput === "user" ? (roleInput as AppRole) : undefined;

        if (!email || !password) return null;

        const user = verifyUserCredentials(email, password, role);
        if (!user) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          initials: user.initials,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: AppRole }).role ?? token.role ?? "user";
        token.initials = (user as { initials?: string }).initials ?? token.initials ?? getInitials(user.name);
      }

      if (account?.provider === "google") {
        token.role = "user";
        token.initials = getInitials(profile?.name ?? token.name);
        token.id = token.id ?? token.sub ?? token.email ?? "google-user";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) || token.sub || token.email || "unknown-user";
        session.user.role = (token.role as AppRole) ?? "user";
        session.user.initials = (token.initials as string) ?? "U";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
