"use client";

import { useEffect } from "react";

type HeroProps = {
  onPrimaryCta?: () => void;
};

export default function Hero({ onPrimaryCta }: HeroProps) {
  useEffect(() => {
    const els = Array.from(
      document.querySelectorAll<HTMLElement>(".hero [data-target]")
    );

    for (const el of els) {
      const raw = el.getAttribute("data-target");
      const target = raw ? Number.parseInt(raw, 10) : NaN;
      if (!Number.isFinite(target)) continue;

      let current = 0;
      const steps = 50;
      const inc = target / steps;

      const timer = window.setInterval(() => {
        current = Math.min(current + inc, target);
        if (target >= 1_000_000) el.textContent = (current / 1_000_000).toFixed(1) + "M+";
        else if (target >= 1000) el.textContent = Math.floor(current / 1000) + "K+";
        else el.textContent = Math.floor(current) + (target === 98 ? "%" : "+");
        if (current >= target) window.clearInterval(timer);
      }, 25);
    }
  }, []);

  return (
    <section className="hero" id="home">
      <div className="hero-orb hero-orb-1" />
      <div className="hero-orb hero-orb-2" />
      <div className="hero-orb hero-orb-3" />
      <div className="hero-grid-bg" />

      <div className="container">
        <div className="hero-inner">
          <div className="hero-left">
            <div className="hero-live-badge animate-up">
              <div className="hero-live-dot" />
              <span>
                <strong>2,847</strong> learners active right now
              </span>
            </div>

            <h1 className="hero-title animate-up delay-1">
              Master Skills
              <br />
              That <span className="line-gold">Shape Your</span>
              <br />
              Future
            </h1>

            <p className="hero-desc animate-up delay-2">
              Join 2.4 million learners accelerating their careers with
              expert-led courses, hands-on projects, and AI-powered personalized
              guidance.
            </p>

            <div className="hero-cta animate-up delay-3">
              <button
                className="btn btn-primary btn-lg"
                type="button"
                onClick={onPrimaryCta}
              >
                Browse Courses →
              </button>
              <a className="btn btn-ghost btn-lg" href="#about">
                ▶ Watch Demo
              </a>
            </div>

            <div className="hero-social-proof animate-up delay-4">
              <div className="hero-avatars">
                <div
                  className="hero-avatar-item"
                  style={{ background: "var(--gold-dim)", color: "var(--gold)" }}
                >
                  JK
                </div>
                <div
                  className="hero-avatar-item"
                  style={{ background: "var(--teal-dim)", color: "var(--teal)" }}
                >
                  LP
                </div>
                <div
                  className="hero-avatar-item"
                  style={{
                    background: "var(--violet-dim)",
                    color: "var(--violet)",
                  }}
                >
                  MR
                </div>
                <div
                  className="hero-avatar-item"
                  style={{ background: "var(--rose-dim)", color: "var(--rose)" }}
                >
                  AN
                </div>
              </div>
              <p className="hero-social-text">
                <strong>4.9★</strong> from 48,000+ reviews
              </p>
            </div>

            <div className="hero-stats animate-up delay-5">
              <div>
                <div className="hero-stat-num" data-target="2400000">
                  0
                </div>
                <div className="hero-stat-lbl">Active Learners</div>
              </div>
              <div style={{ width: 1, background: "var(--border-subtle)" }} />
              <div>
                <div className="hero-stat-num" data-target="1200">
                  0
                </div>
                <div className="hero-stat-lbl">Expert Courses</div>
              </div>
              <div style={{ width: 1, background: "var(--border-subtle)" }} />
              <div>
                <div className="hero-stat-num" data-target="350">
                  0
                </div>
                <div className="hero-stat-lbl">Instructors</div>
              </div>
              <div style={{ width: 1, background: "var(--border-subtle)" }} />
              <div>
                <div className="hero-stat-num" data-target="98">
                  0
                </div>
                <div className="hero-stat-lbl">% Satisfaction</div>
              </div>
            </div>
          </div>

          <div className="hero-right animate-up delay-2">
            <div className="hero-visual" style={{ padding: 30 }}>
              <div className="float-widget float-widget-1">
                <div className="float-icon float-icon-gold">🏆</div>
                <div>
                  <div className="float-label">Achievement</div>
                  <div className="float-value">Top Learner</div>
                </div>
              </div>

              <div className="hero-main-card">
                <div className="hero-card-cover">🤖</div>
                <div className="hero-card-body">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 10,
                    }}
                  >
                    <span className="pill pill-teal">AI & ML</span>
                    <span style={{ color: "var(--gold)", fontSize: 12 }}>
                      ★★★★★ 4.9
                    </span>
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 700,
                      fontSize: 15,
                      marginBottom: 6,
                    }}
                  >
                    Machine Learning Bootcamp 2025
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-secondary)",
                      marginBottom: 14,
                    }}
                  >
                    Dr. Sarah Chen · 48,203 enrolled
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 12,
                      color: "var(--text-secondary)",
                      marginBottom: 6,
                    }}
                  >
                    <span>Progress</span>
                    <span style={{ color: "var(--gold)", fontWeight: 700 }}>
                      68%
                    </span>
                  </div>
                  <div className="hero-progress-bar">
                    <div className="hero-progress-fill" />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginTop: 14,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 10,
                          color: "var(--text-muted)",
                          textTransform: "uppercase",
                          letterSpacing: ".06em",
                        }}
                      >
                        Next Lesson
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: 13,
                          fontWeight: 600,
                          marginTop: 2,
                        }}
                      >
                        Neural Networks Intro
                      </div>
                    </div>
                    <button className="btn btn-primary btn-sm" type="button">
                      ▶ Resume
                    </button>
                  </div>
                </div>
              </div>

              <div className="float-widget float-widget-2">
                <div className="float-icon float-icon-teal">✅</div>
                <div>
                  <div className="float-label">Certificate ready</div>
                  <div className="float-value">React Pro</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
