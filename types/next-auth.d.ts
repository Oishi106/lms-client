import type { DefaultSession } from "next-auth";
import type { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "user" | "admin";
      initials: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: "user" | "admin";
    initials: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string;
    role?: "user" | "admin";
    initials?: string;
  }
}
