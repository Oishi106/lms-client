"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";

import AuthShell from "./AuthShell";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function RegisterForm() {
  const router = useRouter();
  const { status } = useSession();

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
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  async function doGoogleRegister() {
    setSubmitting(true);
    setAuthError(null);

    const result = await signIn("google", {
      redirect: false,
      callbackUrl: "/dashboard",
    });

    if (result?.error) {
      setAuthError("Google sign-up is not configured yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.");
      setSubmitting(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function doRegister() {
    setSubmitting(true);
    setAuthError(null);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        firstName,
        lastName,
        companyName,
        email,
        password,
        role: userType,
      }),
    });

    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setAuthError(data.error ?? "Unable to create account.");
      setSubmitting(false);
      return;
    }

    const signInResult = await signIn("credentials", {
      email,
      password,
      role: userType,
      redirect: false,
      callbackUrl: "/dashboard",
    });

    if (signInResult?.error) {
      setAuthError("Account created, but automatic sign-in failed. Please login manually.");
      setSubmitting(false);
      router.push("/login");
      return;
    }

    router.push("/dashboard");
    router.refresh();
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
      <div className={`error-text${authError ? " show" : ""}`}>{authError}</div>

      {userType === "user" && (
        <div className="social-auth">
          <button
            className="social-auth-btn"
            type="button"
            onClick={doGoogleRegister}
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
        disabled={submitting || status === "loading"}
        onClick={async () => {
          setFirstError(null);
          setEmailError(null);
          setPasswordError(null);
          setAuthError(null);

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

          await doRegister();
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
