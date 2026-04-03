"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import AuthShell from "./AuthShell";
import { AuthUser, useAuth } from "../../providers";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function toInitials(name: string) {
  const cleaned = name.trim();
  if (!cleaned) return "U";
  const parts = cleaned.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "U";
  const second = (parts[1]?.[0] ?? parts[0]?.[1] ?? "").toString();
  return (first + second).toUpperCase();
}

export default function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();

  const [userType, setUserType] = useState<'user' | 'admin'>('user');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const canSubmit = useMemo(() => !submitting, [submitting]);

  function doLogin(next: AuthUser) {
    login(next);
    router.push("/dashboard");
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

      <div className="demo-row">
        <button
          className="demo-btn-item"
          type="button"
          onClick={() => {
            setEmail(userType === "admin" ? "admin@example.com" : "user@example.com");
            setPassword("123456");
            setEmailError(null);
            setPasswordError(null);
          }}
        >
          Use demo credentials
        </button>
      </div>

      {userType === "user" && (
        <div className="social-auth">
          <button
            className="social-auth-btn"
            type="button"
            onClick={() => {
              const next: AuthUser = {
                name: "Google User",
                email: "google@example.com",
                initials: "GU",
                role: "user",
              };
              doLogin(next);
            }}
          >
            Continue with Google
          </button>
          <button className="social-auth-btn" type="button" disabled>
            Apple Sign In (soon)
          </button>
        </div>
      )}

      <div className="or-line">or continue with email</div>

      <div className={`success-banner ${submitting ? "show" : ""}`}>
        {userType === "admin" ? "Admin" : "Learner"} login successful.
      </div>

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
        onClick={() => {
          setEmailError(null);
          setPasswordError(null);

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

          setSubmitting(true);
          window.setTimeout(() => {
            const namePart = email.split("@")[0] ?? "User";
            const displayName = namePart ? namePart[0].toUpperCase() + namePart.slice(1) : "User";

            doLogin({
              name: displayName,
              email,
              initials: toInitials(displayName),
              role: userType,
            });
          }, 700);
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
