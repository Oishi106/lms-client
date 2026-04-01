"use client";

import Link from "next/link";

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
      <div className="auth-box" style={maxWidth ? { maxWidth } : undefined}>
          <Link className="auth-close" href={closeHref} aria-label="Close">
          ✕
        </Link>

        <div className="auth-logo">
          <div className="nav-logo-mark" aria-hidden>
            ⚡
          </div>
        </div>

        <h2 className="auth-title">{title}</h2>
        <p className="auth-sub">{subtitle}</p>

        {children}
      </div>
    </div>
  );
}
