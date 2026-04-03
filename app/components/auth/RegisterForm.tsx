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
      title={userType === "admin" ? "Create admin access" : "Create your account"}
      subtitle={userType === "admin" ? "Manage instructors, revenue, and learners" : "Join a premium learning experience on SkillForge"}
      maxWidth={460}
    >
      <div className="auth-role-grid">
        <button
          type="button"
          className={`auth-role-btn ${userType === "user" ? "active" : ""}`}
          onClick={() => setUserType("user")}
        >
          <span className="role-icon">👤</span>
          <span className="role-text">Learner</span>
          <span className="role-sub">Personal growth</span>
        </button>
        <button
          type="button"
          className={`auth-role-btn ${userType === "admin" ? "active" : ""}`}
          onClick={() => setUserType("admin")}
        >
          <span className="role-icon">🛡️</span>
          <span className="role-text">Admin</span>
          <span className="role-sub">Team operations</span>
        </button>
      </div>

      <div className={`success-banner ${submitting ? "show" : ""}`}>
        {userType === "admin" ? "Admin account ready." : "Account created. Welcome to SkillForge."}
      </div>

      {userType === "user" && (
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
            Continue with Google
          </button>
          <button className="social-auth-btn" type="button" disabled>
            Apple Sign In (soon)
          </button>
        </div>
      )}

      <div className="or-line">or {userType === "admin" ? "set up admin profile" : "register"} with email</div>

      <div className="form-row-2">
        <div className="form-group">
          <label className="form-label">First Name</label>
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

      {userType === "admin" && (
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
        className="btn btn-primary auth-submit"
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
        {submitting ? "Creating account..." : userType === "admin" ? "Create Admin Account" : "Create Free Account"}
      </button>

      <p className="auth-legal">
        By signing up you agree to our Terms and Privacy Policy.
      </p>

      <div className="auth-switch">
        Already have an account? <Link href="/login">Log in</Link>
      </div>
    </AuthShell>
  );
}
