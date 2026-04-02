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
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(251, 146, 60, 0.7); }
          50% { box-shadow: 0 0 0 10px rgba(251, 146, 60, 0); }
        }

        .role-selector {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 28px;
          animation: slideIn 0.5s ease-out;
        }

        .role-btn {
          padding: 16px;
          border: 2px solid var(--border-default);
          border-radius: 12px;
          background: var(--bg-surface);
          cursor: pointer;
          font-weight: 600;
          font-size: 16px;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          color: var(--text-secondary);
        }

        .role-btn:hover {
          border-color: var(--gold);
          background: rgba(251, 146, 60, 0.05);
          transform: translateY(-2px);
        }

        .role-btn.active {
          border-color: var(--gold);
          background: rgba(251, 146, 60, 0.1);
          color: var(--gold);
          box-shadow: 0 8px 24px rgba(251, 146, 60, 0.15);
          animation: pulse 2s infinite;
        }

        .role-icon {
          font-size: 20px;
        }

        .role-label {
          font-size: 12px;
        }
      `}</style>

      {/* Premium Role Selector */}
      <div className="role-selector">
        <button
          type="button"
          className={`role-btn ${userType === 'user' ? 'active' : ''}`}
          onClick={() => setUserType('user')}
        >
          <span className="role-icon">👤</span>
          <span className="role-label">Learner</span>
        </button>
        <button
          type="button"
          className={`role-btn ${userType === 'admin' ? 'active' : ''}`}
          onClick={() => setUserType('admin')}
        >
          <span className="role-icon">🛡️</span>
          <span className="role-label">Admin</span>
        </button>
      </div>

      {/* Quick Demo Button */}
      <div className="demo-row">
        <button
          className="demo-btn-item"
          type="button"
          onClick={() => {
            setEmail(userType === 'admin' ? "admin@example.com" : "user@example.com");
            setPassword("123456");
            setEmailError(null);
            setPasswordError(null);
          }}
        >
          ⚡ Quick Demo
        </button>
      </div>

      {/* Social Auth - Only for Learners */}
      {userType === 'user' && (
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
      )}

      <div className="or-line">or continue with email</div>

      <div className={`success-banner ${submitting ? "show" : ""}`}>
        ✅ {userType === 'admin' ? 'Admin' : 'Learner'} login successful!
      </div>

      {/* Email Input */}
      <div className="form-group">
        <label className="form-label">{userType === 'admin' ? 'Admin Email' : 'Email Address'}</label>
        <input
          className={`input-field${emailError ? " error" : ""}`}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={userType === 'admin' ? 'admin@example.com' : 'you@example.com'}
          autoComplete="email"
        />
        <div className={`error-text${emailError ? " show" : ""}`}>{emailError}</div>
      </div>

      {/* Password Input */}
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

      {/* Login Button */}
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
        {userType === 'admin' ? 'Admin Log In' : 'Log In'} →
      </button>

      {/* Switch Account Type */}
      <div className="auth-switch">
        {userType === 'admin' ? 'Are you a learner?' : "Want to manage courses?"} <Link href="#" onClick={(e) => { e.preventDefault(); setUserType(userType === 'admin' ? 'user' : 'admin'); }}>{userType === 'admin' ? 'Sign in as learner' : 'Sign in as admin'}</Link>
      </div>

      {/* Sign Up Link */}
      <div className="auth-switch">
        No account? <Link href="/register">Sign up free</Link>
      </div>
    </AuthShell>
  );
}
