import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // সেশন না থাকলে NextAuth অটোমেটিক /login এ পাঠিয়ে দিবে (signIn page config অনুযায়ী)
    return NextResponse.next();
  },
  {
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  // ড্যাশবোর্ড এবং চেকআউট পেজকে প্রোটেক্ট করার জন্য
  matcher: ["/dashboard/:path*", "/checkout/:path*"],
};