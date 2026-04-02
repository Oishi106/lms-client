"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";

import { useAuth, useTheme } from "../../providers";

export default function Navbar() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const safeUser = mounted ? user : null;
  const safeTheme = mounted ? theme : "dark";

  return (
    <nav className="navbar" id="navbar">
      <div className="nav-inner">
        <Link className="nav-logo" href="/" aria-label="SkillForge Home">
          <div className="nav-logo-mark" aria-hidden>
            ⚡
          </div>
          SkillForge
        </Link>

        <div className="nav-links" id="navLinks">
          <Link className="nav-link" href="/">
            Home
          </Link>
          <Link className="nav-link" href="/explore">
            Explore
          </Link>
          <Link className="nav-link" href="/categories">
            Categories
          </Link>
          <Link className="nav-link" href="/#instructors">
            Instructors
          </Link>
          <Link className="nav-link" href="/#faq">
            FAQ
          </Link>
          <Link className="nav-link" href="/#about">
            About
          </Link>
          <Link className="nav-link" href="/contact">
            Contact
          </Link>
          {safeUser ? (
            <Link className="nav-link" href="/dashboard">
              Dashboard
            </Link>
          ) : null}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            className="theme-toggle"
            id="themeBtn"
            title="Toggle theme"
            type="button"
            onClick={toggleTheme}
          >
            {safeTheme === "dark" ? "☀️" : "🌙"}
          </button>

          {!safeUser ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Link className="btn btn-ghost btn-sm" href="/login">
                Log in
              </Link>
              <Link className="btn btn-primary btn-sm" href="/register">
                Sign up free
              </Link>
            </div>
          ) : (
            <div className="nav-dropdown">
              <div className="nav-avatar" aria-label="Account">
                {safeUser.initials}
              </div>
              <div
                className="nav-dropdown-menu"
                style={{ right: 0, left: "auto", transform: "none" }}
              >
                <Link className="nav-dropdown-item" href="/dashboard">
                  📊 Dashboard
                </Link>
                <div className="nav-dropdown-divider" />
                <button
                  className="nav-dropdown-item"
                  type="button"
                  onClick={() => {
                    logout();
                    router.push("/");
                  }}
                  style={{ color: "var(--rose)", width: "100%" }}
                >
                  🚪 Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
