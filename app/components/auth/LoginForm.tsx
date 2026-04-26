"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";

import AuthShell from "./AuthShell";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function LoginForm() {
  const router = useRouter();
  const { status } = useSession();

  const [userType, setUserType] = useState<'user' | 'admin'>('user');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {         
      router.replace("/dashboard");
    }
  }, [status, router]);

  const canSubmit = useMemo(() => !submitting && status !== "loading", [submitting, status]);

  async function doGoogleLogin() {
    setSubmitting(true);
    setAuthError(null);

    const result = await signIn("google", {
      redirect: false,
      callbackUrl: "/dashboard",
    });

    if (result?.error) {
      setAuthError("Google sign-in is not configured yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.");
      setSubmitting(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function doLogin(nextEmail: string, nextPassword: string, role: "user" | "admin") {
    setSubmitting(true);
    setAuthError(null);

    try {
      const result = await signIn("credentials", {
        email: nextEmail,
        password: nextPassword,
        role,
        redirect: false,
        callbackUrl: "/dashboard",
      });

      if (result?.error) {
        setAuthError(
          role === "admin"
            ? "Invalid admin credentials, or this account is not an admin."
            : "Invalid email or password."
        );
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Continue your learning journey">
      <div className="auth-role-grid">
        <button
          type="button"
          className={`auth-role-btn ${userType === "user" ? "active" : ""}`}
          onClick={() => setUserType("user")}
        >
          <span className="role-icon">👤</span>
          <span className="role-text">Learner Mode</span>
          <span className="role-sub">Course access</span>
        </button>
        <button
          type="button"
          className={`auth-role-btn ${userType === "admin" ? "active" : ""}`}
          onClick={() => setUserType("admin")}
        >
          <span className="role-icon">🛡️</span>
          <span className="role-text">Admin Mode</span>
          <span className="role-sub">Control center</span>
        </button>
      </div>

      {userType === "user" && (
        <div className="social-auth">
          <button
            className="social-auth-btn"
            type="button"
            onClick={doGoogleLogin}
          >
            Continue with Google
          </button>
          <button className="social-auth-btn" type="button" disabled>
            Apple Sign In (soon)
          </button>
        </div>
      )}

      <div className="or-line">or continue with email</div>

      <div className="success-banner" />
      <div className={`error-text${authError ? " show" : ""}`}>{authError}</div>

      <div className="form-group">
        <label className="form-label">{userType === "admin" ? "Admin Email" : "Email Address"}</label>
        <input
          className={`input-field${emailError ? " error" : ""}`}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={userType === "admin" ? "admin@example.com" : "you@example.com"}
          autoComplete="email"
        />
        <div className={`error-text${emailError ? " show" : ""}`}>{emailError}</div>
      </div>

      <div className="form-group">
        <label className="form-label">
          Password <Link className="forgot-link" href="/register">Need access?</Link>
        </label>
        <input
          className={`input-field${passwordError ? " error" : ""}`}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
        />
        <div className={`error-text${passwordError ? " show" : ""}`}>{passwordError}</div>
      </div>

      <button
        className="btn btn-primary auth-submit"
        type="button"
        disabled={!canSubmit}
        onClick={async () => {
          setEmailError(null);
          setPasswordError(null);
          setAuthError(null);

          let ok = true;
          if (!isValidEmail(email)) {
            setEmailError("Please enter a valid email.");
            ok = false;
          }
          if (password.length < 6) {
            setPasswordError("Password must be at least 6 characters.");
            ok = false;
          }
          if (!ok) return;

          await doLogin(email, password, userType);
        }}
      >
        {submitting ? "Signing in..." : userType === "admin" ? "Enter Admin Workspace" : "Enter Learning Space"}
      </button>

      <div className="auth-switch">
        {userType === "admin" ? "Are you a learner?" : "Need management access?"}{" "}
        <button
          type="button"
          className="auth-inline-btn"
          onClick={() => setUserType(userType === "admin" ? "user" : "admin")}
        >
          {userType === "admin" ? "Switch to learner" : "Switch to admin"}
        </button>
      </div>

      <div className="auth-switch">
        No account? <Link href="/register">Sign up free</Link>
      </div>
    </AuthShell>
  );
}
