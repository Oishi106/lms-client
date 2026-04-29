"use client";

import Link from "next/link";

import BrandLogo from "../BrandLogo";

export default function AuthShell({
  title,
  subtitle,
  closeHref = "/",
  maxWidth,
  children,
}: {
  title: string;
  subtitle: string;
  closeHref?: string;
  maxWidth?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="auth-overlay">
      <div className="auth-ambient auth-ambient-one" aria-hidden />
      <div className="auth-ambient auth-ambient-two" aria-hidden />
      <div className="auth-box" style={maxWidth ? { maxWidth } : undefined}>
        <Link className="auth-close" href={closeHref} aria-label="Close">
          ✕
        </Link>

        <div className="auth-top-tag">Secure access</div>

        <div className="auth-logo-wrap">
          <div className="auth-logo">
            <BrandLogo size={72} />
          </div>
        </div>

        <h2 className="auth-title">{title}</h2>
        <p className="auth-sub">{subtitle}</p>

        {children}

        <div className="auth-foot-note">
          <span>Protected by encrypted session</span>
          <span className="auth-foot-dot" aria-hidden />
          <span>24/7 system monitoring</span>
        </div>
      </div>
    </div>
  );
}
