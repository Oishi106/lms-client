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
      <div className="demo-row">
        <button
          className="demo-btn-item"
          type="button"
          onClick={() => {
            setEmail("user@example.com");
            setPassword("123456");
            setEmailError(null);
            setPasswordError(null);
          }}
        >
          👤 User Demo
        </button>
        <button
          className="demo-btn-item"
          type="button"
          onClick={() => {
            setEmail("admin@example.com");
            setPassword("123456");
            setEmailError(null);
            setPasswordError(null);
          }}
        >
          🛡 Admin Demo
        </button>
      </div>

      <div className={`success-banner ${submitting ? "show" : ""}`}>✅ Logging you in...</div>

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
          🔵 Google
        </button>
        <button className="social-auth-btn" type="button" disabled>
          🔷 Facebook
        </button>
      </div>

      <div className="or-line">or continue with email</div>

      <div className="form-group">
        <label className="form-label">Email Address</label>
        <input
          className={`input-field${emailError ? " error" : ""}`}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
        />
        <div className={`error-text${emailError ? " show" : ""}`}>{emailError}</div>
      </div>

      <div className="form-group">
        <label className="form-label">
          Password <span className="forgot-link">Forgot?</span>
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
        className="btn btn-primary"
        style={{ width: "100%", marginTop: 4 }}
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

          const role = email === "admin@example.com" ? "admin" : "user";
          const namePart = email.split("@")[0] ?? "User";
          const displayName = namePart ? namePart[0].toUpperCase() + namePart.slice(1) : "User";

          setSubmitting(true);
          window.setTimeout(() => {
            doLogin({
              name: displayName,
              email,
              initials: toInitials(displayName),
              role,
            });
          }, 700);
        }}
      >
        Log In →
      </button>

      <div className="auth-switch">
        No account? <Link href="/register">Sign up free</Link>
      </div>
    </AuthShell>
  );
}
