"use client";

import { useState } from "react";
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

export default function RegisterForm() {
  const router = useRouter();
  const { login } = useAuth();

  const [userType, setUserType] = useState<'user' | 'admin'>('user');
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [firstError, setFirstError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  function doRegister(next: AuthUser) {
    login(next);
    router.push("/dashboard");
  }

  return (
    <AuthShell
      title={userType === 'admin' ? 'Become an Admin' : 'Create account'}
      subtitle={userType === 'admin' ? 'Manage courses and instructors' : 'Join 2.4 million learners on SkillForge'}
      maxWidth={460}
    >
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

      <div className={`success-banner ${submitting ? "show" : ""}`}>
        {userType === 'admin' ? '🎉 Admin account created!' : '🎉 Account created! Welcome to SkillForge!'}
      </div>

      {/* Social Auth - Only for Learners */}
      {userType === 'user' && (
        <div className="social-auth">
          <button
            className="social-auth-btn"
            type="button"
            onClick={() => {
              doRegister({
                name: "Google User",
                email: "google@example.com",
                initials: "GU",
                role: "user",
              });
            }}
          >
            🔵 Google
          </button>
          <button className="social-auth-btn" type="button" disabled>
            🔷 Facebook
          </button>
        </div>
      )}

      <div className="or-line">or {userType === 'admin' ? 'create admin account' : 'sign up'} with email</div>

      {/* Name Fields */}
      <div className="form-row-2">
        <div className="form-group">
          <label className="form-label">{userType === 'admin' ? 'First Name' : 'First Name'}</label>
          <input
            className={`input-field${firstError ? " error" : ""}`}
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Jane"
            autoComplete="given-name"
          />
          <div className={`error-text${firstError ? " show" : ""}`}>{firstError}</div>
        </div>
        <div className="form-group">
          <label className="form-label">Last Name</label>
          <input
            className="input-field"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Doe"
            autoComplete="family-name"
          />
        </div>
      </div>

      {/* Company Name - Only for Admins */}
      {userType === 'admin' && (
        <div className="form-group">
          <label className="form-label">Company/Organization Name</label>
          <input
            className="input-field"
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Your company name"
            autoComplete="organization"
          />
        </div>
      )}

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
        <label className="form-label">Password</label>
        <input
          className={`input-field${passwordError ? " error" : ""}`}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Min. 6 characters"
          autoComplete="new-password"
        />
        <div className={`error-text${passwordError ? " show" : ""}`}>{passwordError}</div>
      </div>

      <div className="form-group">
        <label className="form-label">I want to</label>
        <select className="input-field">
          {userType === 'user' ? (
            <>
              <option>Learn new skills</option>
              <option>Switch careers</option>
              <option>Get certified</option>
              <option>Become an instructor</option>
            </>
          ) : (
            <>
              <option>Manage courses</option>
              <option>Manage instructors</option>
              <option>Manage students</option>
            </>
          )}
        </select>
      </div>

      <button
        className="btn btn-primary"
        style={{ width: "100%" }}
        type="button"
        onClick={() => {
          setFirstError(null);
          setEmailError(null);
          setPasswordError(null);

          let ok = true;
          if (!firstName.trim()) {
            setFirstError("Required.");
            ok = false;
          }
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

          const displayName = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ") || firstName.trim();

          window.setTimeout(() => {
            doRegister({
              name: displayName,
              email,
              initials: toInitials(displayName),
              role: userType,
            });
          }, 700);
        }}
      >
        {userType === 'admin' ? 'Create Admin Account' : 'Create Free Account'} →
      </button>

      <p style={{ textAlign: "center", fontSize: 11, color: "var(--text-muted)", marginTop: 12 }}>
        By signing up you agree to our Terms &amp; Privacy Policy
      </p>

      <div className="auth-switch">
        Already have an account? <Link href="/login">Log in</Link>
      </div>
    </AuthShell>
  );
}
