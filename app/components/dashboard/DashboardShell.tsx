"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "../../providers";
import {
  getInitialUserAdminChat,
  saveUserAdminChat,
  subscribeUserAdminChat,
  type UserAdminChatMessage,
} from "@/app/lib/user-admin-chat";
import { appendAdminNotification } from "@/app/lib/admin-notifications";

type Panel =
  | "ov"
  | "courses"
  | "bookings"
  | "profile"
  | "reviews-d"
  | "users"
  | "manage-courses"
  | "orders"
  | "analytics"
  | "settings"
  | "ai-chat";

function SidebarLink({
  active,
  icon,
  label,
  badge,
  onClick,
}: {
  active: boolean;
  icon: string;
  label: string;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <div className={`sidebar-link${active ? " active" : ""}`} onClick={onClick}>
      <span className="s-icon">{icon}</span>
      {label}
      {badge ? <span className="sidebar-badge">{badge}</span> : null}
    </div>
  );
}

export default function DashboardShell() {
  const router = useRouter();
  const { user } = useAuth();

  const [activePanel, setActivePanel] = useState<Panel>("ov");
  const [profileSaved, setProfileSaved] = useState(false);

  const [chatMsgs, setChatMsgs] = useState<UserAdminChatMessage[]>(getInitialUserAdminChat);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!user) router.replace("/login");
  }, [user, router]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMsgs]);

  useEffect(() => subscribeUserAdminChat(() => setChatMsgs(getInitialUserAdminChat())), []);

  const displayName = user?.name ?? "Learner";

  const recentCourses = useMemo(
    () => [
      {
        emoji: "🤖",
        title: "ML Bootcamp 2025",
        instructor: "Dr. Sarah Chen",
        progressLabel: "67%",
        progressWidth: "67%",
        status: "Active",
        statusClass: "pill pill-teal",
        action: "Resume",
        colorBg: "var(--gold-dim)",
        colorText: "var(--gold)",
      },
      {
        emoji: "⚛️",
        title: "React Mastery",
        instructor: "Marcus Reid",
        progressLabel: "Done",
        progressWidth: "100%",
        status: "Completed",
        statusClass: "pill pill-teal",
        action: "Certificate",
        colorBg: "var(--teal-dim)",
        colorText: "var(--teal)",
      },
      {
        emoji: "🎨",
        title: "UX Design Pro",
        instructor: "Aisha Nwosu",
        progressLabel: "23%",
        progressWidth: "23%",
        status: "In Progress",
        statusClass: "pill pill-gold",
        action: "Continue",
        colorBg: "var(--violet-dim)",
        colorText: "var(--violet)",
      },
    ],
    []
  );

  if (!user) return null;

  function sendChatMsg() {
    const msg = chatInput.trim();
    if (!msg || !user) return;

    const nextMessage: UserAdminChatMessage = {
      id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      senderRole: "user",
      senderName: user.name,
      text: msg,
      createdAt: Date.now(),
    };

    const updated = saveUserAdminChat([...chatMsgs, nextMessage]);
    setChatMsgs(updated);
    appendAdminNotification({
      type: "message",
      title: "New User Message",
      description: `${user.name} sent a new support message.`,
    });
    setChatInput("");
  }

  return (
    <div className="dashboard-wrap">
      <aside className="sidebar">
        <div className="sidebar-section">
          <div className="sidebar-label">Main</div>
          <SidebarLink
            active={activePanel === "ov"}
            icon="📊"
            label="Overview"
            onClick={() => setActivePanel("ov")}
          />
          <SidebarLink
            active={activePanel === "courses"}
            icon="📚"
            label="My Courses"
            onClick={() => setActivePanel("courses")}
          />
          <SidebarLink
            active={activePanel === "bookings"}
            icon="📅"
            label="Bookings"
            badge="3"
            onClick={() => setActivePanel("bookings")}
          />
          <SidebarLink
            active={activePanel === "profile"}
            icon="👤"
            label="My Profile"
            onClick={() => setActivePanel("profile")}
          />
          <SidebarLink
            active={activePanel === "reviews-d"}
            icon="⭐"
            label="My Reviews"
            onClick={() => setActivePanel("reviews-d")}
          />
        </div>

        {isAdmin ? (
          <div className="sidebar-section">
            <div className="sidebar-label">Admin</div>
            <SidebarLink
              active={activePanel === "users"}
              icon="👥"
              label="Users"
              onClick={() => setActivePanel("users")}
            />
            <SidebarLink
              active={activePanel === "manage-courses"}
              icon="🎓"
              label="All Courses"
              onClick={() => setActivePanel("manage-courses")}
            />
            <SidebarLink
              active={activePanel === "orders"}
              icon="🛒"
              label="Orders"
              onClick={() => setActivePanel("orders")}
            />
            <SidebarLink
              active={activePanel === "analytics"}
              icon="📈"
              label="Analytics"
              onClick={() => setActivePanel("analytics")}
            />
            <SidebarLink
              active={activePanel === "settings"}
              icon="⚙️"
              label="Settings"
              onClick={() => setActivePanel("settings")}
            />
          </div>
        ) : null}

        <div className="sidebar-section">
          <div className="sidebar-label">AI Tools</div>
          <SidebarLink
            active={activePanel === "ai-chat"}
            icon="💬"
            label="Admin Chat"
            onClick={() => setActivePanel("ai-chat")}
          />
        </div>
      </aside>

      <main className="dash-main">
        <div className={`dash-page${activePanel === "ov" ? " active" : ""}`}>
          <div className="dash-top">
            <div>
              <div className="dash-top-title">
                Good morning, <span className="text-gold">{displayName}</span> 👋
              </div>
              <div className="dash-top-sub">Here’s your learning activity today.</div>
            </div>
            <button className="btn btn-primary" type="button" onClick={() => router.push("/")}
            >
              + Enroll Course
            </button>
          </div>

          <div className="ov-grid">
            <div className="ov-card">
              <div className="ov-icon-wrap" style={{ background: "var(--gold-dim)" }}>
                📚
              </div>
              <div className="ov-label">Enrolled Courses</div>
              <div className="ov-value text-gold">7</div>
              <div className="ov-change">↑ +2 this month</div>
            </div>
            <div className="ov-card">
              <div className="ov-icon-wrap" style={{ background: "var(--teal-dim)" }}>
                ✅
              </div>
              <div className="ov-label">Completed</div>
              <div className="ov-value" style={{ color: "var(--teal)" }}>
                3
              </div>
              <div className="ov-change">43% rate</div>
            </div>
            <div className="ov-card">
              <div className="ov-icon-wrap" style={{ background: "var(--violet-dim)" }}>
                🔥
              </div>
              <div className="ov-label">Day Streak</div>
              <div className="ov-value" style={{ color: "var(--violet)" }}>
                24
              </div>
              <div className="ov-change">Personal best!</div>
            </div>
            <div className="ov-card">
              <div className="ov-icon-wrap" style={{ background: "var(--rose-dim)" }}>
                🏆
              </div>
              <div className="ov-label">Certificates</div>
              <div className="ov-value" style={{ color: "var(--rose)" }}>
                3
              </div>
              <div className="ov-change">Ready to share</div>
            </div>
          </div>

          {isAdmin ? (
            <div style={{ display: "block", marginBottom: 28 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: ".08em",
                  marginBottom: 14,
                }}
              >
                Platform Overview (Admin)
              </div>
              <div className="ov-grid">
                <div className="ov-card">
                  <div className="ov-icon-wrap" style={{ background: "var(--gold-dim)" }}>
                    👥
                  </div>
                  <div className="ov-label">Total Users</div>
                  <div className="ov-value text-gold">1,247</div>
                  <div className="ov-change">↑ +48 this week</div>
                </div>
                <div className="ov-card">
                  <div className="ov-icon-wrap" style={{ background: "var(--teal-dim)" }}>
                    🎓
                  </div>
                  <div className="ov-label">Total Courses</div>
                  <div className="ov-value" style={{ color: "var(--teal)" }}>
                    430
                  </div>
                  <div className="ov-change">↑ +12 this month</div>
                </div>
                <div className="ov-card">
                  <div className="ov-icon-wrap" style={{ background: "var(--violet-dim)" }}>
                    🛒
                  </div>
                  <div className="ov-label">Total Orders</div>
                  <div className="ov-value" style={{ color: "var(--violet)" }}>
                    210
                  </div>
                  <div className="ov-change">↑ +23 this week</div>
                </div>
                <div className="ov-card">
                  <div className="ov-icon-wrap" style={{ background: "rgba(46,232,207,0.1)" }}>
                    💰
                  </div>
                  <div className="ov-label">Revenue</div>
                  <div className="ov-value text-teal">$35K</div>
                  <div className="ov-change">↑ +12% vs last month</div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="d-row-2">
            <div className="d-card">
              <h3>Learning Activity — Last 7 Days</h3>
              <div className="bar-chart">
                {[40, 70, 30, 90, 55, 80, 65].map((h, i) => (
                  <div className="bar-col" key={i}>
                    <div
                      className={`bar-fill${i >= 5 ? " teal" : ""}`}
                      style={{ height: `${h}%` }}
                    />
                    <div className="bar-label">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="d-card">
              <h3>Skill Mix</h3>
              {[
                { label: "Development", val: "42%", c: "var(--gold)" },
                { label: "AI & ML", val: "28%", c: "var(--teal)" },
                { label: "Design", val: "18%", c: "var(--violet)" },
                { label: "Data Science", val: "12%", c: "var(--rose)" },
              ].map((row) => (
                <div className="mini-list-item" key={row.label}>
                  <div className="mini-list-left">
                    <div className="mini-dot" style={{ background: row.c }} />
                    {row.label}
                  </div>
                  <div className="mini-list-val">{row.val}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="d-card" style={{ marginTop: 20 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <h3 style={{ margin: 0 }}>Recent Courses</h3>
              <span
                style={{ fontSize: 13, color: "var(--gold)", cursor: "pointer" }}
                onClick={() => setActivePanel("courses")}
              >
                View all →
              </span>
            </div>

            <div className="data-table-wrap">
              <table className="d-table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Instructor</th>
                    <th>Progress</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {recentCourses.map((c) => (
                    <tr key={c.title}>
                      <td>
                        <div className="user-cell-row">
                          <div
                            className="u-avatar-sm"
                            style={{ background: c.colorBg, color: c.colorText }}
                          >
                            {c.emoji}
                          </div>
                          {c.title}
                        </div>
                      </td>
                      <td style={{ color: "var(--text-secondary)" }}>{c.instructor}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div
                            style={{
                              width: 70,
                              height: 4,
                              background: "var(--border-subtle)",
                              borderRadius: 2,
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                width: c.progressWidth,
                                height: "100%",
                                background:
                                  c.emoji === "⚛️" ? "var(--teal)" : c.emoji === "🎨" ? "var(--violet)" : "var(--gold)",
                                borderRadius: 2,
                              }}
                            />
                          </div>
                          <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                            {c.progressLabel}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={c.statusClass}>{c.status}</span>
                      </td>
                      <td>
                        <button className="action-sm" type="button">
                          {c.action}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className={`dash-page${activePanel === "courses" ? " active" : ""}`}>
          <div className="dash-top">
            <div>
              <div className="dash-top-title">My Courses</div>
              <div className="dash-top-sub">Track your enrolled courses</div>
            </div>
          </div>
          <div className="d-card">
            <table className="d-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Status</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                {recentCourses.map((c) => (
                  <tr key={`mc-${c.title}`}>
                    <td>{c.title}</td>
                    <td>
                      <span className={c.statusClass}>{c.status}</span>
                    </td>
                    <td style={{ color: "var(--text-secondary)" }}>{c.progressLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={`dash-page${activePanel === "bookings" ? " active" : ""}`}>
          <div className="dash-top">
            <div>
              <div className="dash-top-title">My Bookings</div>
            </div>
          </div>
          <div className="d-card">
            <table className="d-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Date</th>
                  <th>Price</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>ML Bootcamp 2025</td>
                  <td style={{ color: "var(--text-secondary)" }}>Jan 15, 2025</td>
                  <td style={{ color: "var(--gold)", fontWeight: 700 }}>$89</td>
                  <td>
                    <span className="pill pill-teal">Active</span>
                  </td>
                </tr>
                <tr>
                  <td>React Mastery</td>
                  <td style={{ color: "var(--text-secondary)" }}>Dec 2, 2024</td>
                  <td style={{ color: "var(--gold)", fontWeight: 700 }}>$79</td>
                  <td>
                    <span className="pill pill-teal">Completed</span>
                  </td>
                </tr>
                <tr>
                  <td>UX Design Pro</td>
                  <td style={{ color: "var(--text-secondary)" }}>Feb 1, 2025</td>
                  <td style={{ color: "var(--gold)", fontWeight: 700 }}>$99</td>
                  <td>
                    <span className="pill pill-gold">Pending</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className={`dash-page${activePanel === "profile" ? " active" : ""}`}>
          <div className="dash-top">
            <div>
              <div className="dash-top-title">My Profile</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 24 }}>
            <div className="d-card" style={{ textAlign: "center", height: "fit-content" }}>
              <div
                className="profile-ava-big"
                style={{ background: "var(--gold-dim)", color: "var(--gold)" }}
              >
                {user.initials}
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700 }}>
                {user.name}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 20 }}>
                {user.email}
              </div>
              <button className="btn btn-ghost" style={{ width: "100%", fontSize: 13 }} type="button">
                Change Photo
              </button>
            </div>

            <div className="d-card">
              <h3 style={{ marginBottom: 22 }}>Edit Profile</h3>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input className="input-field" defaultValue={user.name.split(" ")[0] ?? user.name} />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input className="input-field" defaultValue={user.name.split(" ").slice(1).join(" ")} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="input-field" defaultValue={user.email} />
              </div>

              <div className="form-group">
                <label className="form-label">Bio</label>
                <textarea className="input-field" rows={3} placeholder="Tell us about yourself..." />
              </div>

              <div className="form-group">
                <label className="form-label">Website</label>
                <input className="input-field" placeholder="https://yoursite.com" />
              </div>

              <div className={`success-banner ${profileSaved ? "show" : ""}`} style={{ marginBottom: 14 }}>
                ✅ Profile updated successfully!
              </div>

              <button
                className="btn btn-primary"
                type="button"
                onClick={() => {
                  setProfileSaved(true);
                  window.setTimeout(() => setProfileSaved(false), 2500);
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>

        <div className={`dash-page${activePanel === "reviews-d" ? " active" : ""}`}>
          <div className="dash-top">
            <div>
              <div className="dash-top-title">My Reviews</div>
            </div>
          </div>
          <div className="d-card">
            <p style={{ color: "var(--text-secondary)", marginBottom: 16 }}>
              You haven’t written any reviews yet. Share your experience to help other learners!
            </p>
            <button className="btn btn-primary" type="button" onClick={() => router.push("/")}
            >
              Find Courses to Review
            </button>
          </div>
        </div>

        <div className={`dash-page${activePanel === "users" ? " active" : ""}`}>
          <div className="dash-top">
            <div>
              <div className="dash-top-title">Manage Users</div>
              <div className="dash-top-sub">1,247 registered users</div>
            </div>
            <button className="btn btn-primary" type="button">
              + Add User
            </button>
          </div>

          <div className="d-card">
            <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
              <div className="search-chip" style={{ maxWidth: 260 }}>
                <span style={{ color: "var(--text-muted)" }}>🔍</span>
                <input type="text" placeholder="Search users..." />
              </div>
              <select className="sort-sel" defaultValue="All Roles">
                <option>All Roles</option>
                <option>User</option>
                <option>Admin</option>
              </select>
              <select className="sort-sel" defaultValue="All Status">
                <option>All Status</option>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>

            <div className="data-table-wrap">
              <table className="d-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Courses</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      initials: "JK",
                      name: "James Kim",
                      email: "james@example.com",
                      role: "USER",
                      roleClass: "pill pill-teal",
                      courses: 7,
                      status: "Active",
                      statusClass: "pill pill-teal",
                      bg: "var(--gold-dim)",
                      fg: "var(--gold)",
                    },
                    {
                      initials: "LP",
                      name: "Lena Pavlov",
                      email: "lena@example.com",
                      role: "USER",
                      roleClass: "pill pill-teal",
                      courses: 4,
                      status: "Active",
                      statusClass: "pill pill-teal",
                      bg: "var(--violet-dim)",
                      fg: "var(--violet)",
                    },
                    {
                      initials: "FO",
                      name: "Fatima Osei",
                      email: "admin@example.com",
                      role: "ADMIN",
                      roleClass: "pill pill-gold",
                      courses: 12,
                      status: "Inactive",
                      statusClass: "pill pill-rose",
                      bg: "var(--gold-dim)",
                      fg: "var(--gold)",
                    },
                    {
                      initials: "TK",
                      name: "Tom Katsuki",
                      email: "tom@example.com",
                      role: "USER",
                      roleClass: "pill pill-teal",
                      courses: 3,
                      status: "Pending",
                      statusClass: "pill pill-gold",
                      bg: "var(--teal-dim)",
                      fg: "var(--teal)",
                    },
                  ].map((u) => (
                    <tr key={u.email}>
                      <td>
                        <div className="user-cell-row">
                          <div className="u-avatar-sm" style={{ background: u.bg, color: u.fg }}>
                            {u.initials}
                          </div>
                          {u.name}
                        </div>
                      </td>
                      <td style={{ fontSize: 13, color: "var(--text-secondary)" }}>{u.email}</td>
                      <td>
                        <span className={u.roleClass}>{u.role}</span>
                      </td>
                      <td>{u.courses}</td>
                      <td>
                        <span className={u.statusClass}>{u.status}</span>
                      </td>
                      <td style={{ display: "flex", gap: 6 }}>
                        <button className="action-sm" type="button">
                          Edit
                        </button>
                        <button className="action-sm danger" type="button">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              {['‹','1','2','3','›'].map((t) => (
                <button
                  key={t}
                  className={`page-item${t === '1' ? ' active' : ''}`}
                  type="button"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={`dash-page${activePanel === "manage-courses" ? " active" : ""}`}>
          <div className="dash-top">
            <div>
              <div className="dash-top-title">Manage Courses</div>
            </div>
            <button className="btn btn-primary" type="button">
              + Add Course
            </button>
          </div>
          <div className="d-card">
            <table className="d-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Instructor</th>
                  <th>Students</th>
                  <th>Revenue</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    course: "ML Bootcamp 2025",
                    inst: "Dr. Sarah Chen",
                    students: "48,203",
                    revenue: "$42,899",
                    status: "Published",
                    statusClass: "pill pill-teal",
                  },
                  {
                    course: "React Mastery",
                    inst: "Marcus Reid",
                    students: "62,145",
                    revenue: "$49,094",
                    status: "Published",
                    statusClass: "pill pill-teal",
                  },
                  {
                    course: "UX Design Pro",
                    inst: "Aisha Nwosu",
                    students: "31,400",
                    revenue: "$31,086",
                    status: "Draft",
                    statusClass: "pill pill-gold",
                  },
                ].map((c) => (
                  <tr key={c.course}>
                    <td>{c.course}</td>
                    <td style={{ color: "var(--text-secondary)" }}>{c.inst}</td>
                    <td>{c.students}</td>
                    <td style={{ color: "var(--gold)", fontWeight: 700 }}>{c.revenue}</td>
                    <td>
                      <span className={c.statusClass}>{c.status}</span>
                    </td>
                    <td style={{ display: "flex", gap: 6 }}>
                      <button className="action-sm" type="button">
                        Edit
                      </button>
                      <button className="action-sm danger" type="button">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={`dash-page${activePanel === "orders" ? " active" : ""}`}>
          <div className="dash-top">
            <div>
              <div className="dash-top-title">Orders</div>
            </div>
          </div>
          <div className="d-card">
            <table className="d-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>User</th>
                  <th>Course</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { id: "#ORD-8821", user: "James Kim", course: "ML Bootcamp", amt: "$89", st: "Paid", cls: "pill pill-teal" },
                  { id: "#ORD-8820", user: "Lena Pavlov", course: "React Mastery", amt: "$79", st: "Paid", cls: "pill pill-teal" },
                  { id: "#ORD-8819", user: "Fatima Osei", course: "UX Design Pro", amt: "$99", st: "Pending", cls: "pill pill-gold" },
                ].map((o) => (
                  <tr key={o.id}>
                    <td style={{ color: "var(--text-muted)", fontSize: 12 }}>{o.id}</td>
                    <td>{o.user}</td>
                    <td>{o.course}</td>
                    <td style={{ color: "var(--gold)", fontWeight: 700 }}>{o.amt}</td>
                    <td>
                      <span className={o.cls}>{o.st}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={`dash-page${activePanel === "analytics" ? " active" : ""}`}>
          <div className="dash-top">
            <div>
              <div className="dash-top-title">Analytics</div>
            </div>
          </div>

          <div className="ov-grid" style={{ marginBottom: 24 }}>
            <div className="ov-card">
              <div className="ov-label">Monthly Revenue</div>
              <div className="ov-value text-gold">$12,840</div>
              <div className="ov-change">↑ +18% vs last month</div>
            </div>
            <div className="ov-card">
              <div className="ov-label">New Signups</div>
              <div className="ov-value" style={{ color: "var(--teal)" }}>
                342
              </div>
              <div className="ov-change">↑ +8% vs last month</div>
            </div>
            <div className="ov-card">
              <div className="ov-label">Completions</div>
              <div className="ov-value" style={{ color: "var(--violet)" }}>
                128
              </div>
              <div className="ov-change">↑ +22% vs last month</div>
            </div>
            <div className="ov-card">
              <div className="ov-label">Avg Session (min)</div>
              <div className="ov-value" style={{ color: "var(--rose)" }}>
                42
              </div>
              <div className="ov-change">↑ +5 vs last month</div>
            </div>
          </div>

          <div className="d-card">
            <h3>Revenue — Last 12 Months</h3>
            <div className="bar-chart" style={{ height: 200 }}>
              {[32, 44, 37, 56, 47, 68, 57, 78, 70, 90, 80, 100].map((h, i) => (
                <div className="bar-col" key={i}>
                  <div className={`bar-fill${i >= 7 ? " teal" : ""}`} style={{ height: `${h}%` }} />
                  <div className="bar-label">
                    {[
                      "Apr",
                      "May",
                      "Jun",
                      "Jul",
                      "Aug",
                      "Sep",
                      "Oct",
                      "Nov",
                      "Dec",
                      "Jan",
                      "Feb",
                      "Mar",
                    ][i]}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={`dash-page${activePanel === "settings" ? " active" : ""}`}>
          <div className="dash-top">
            <div>
              <div className="dash-top-title">Settings</div>
            </div>
          </div>

          <div className="d-card">
            <h3 style={{ marginBottom: 22 }}>Notification Preferences</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {[
                {
                  title: "Email Notifications",
                  desc: "Course updates and announcements",
                  checked: true,
                },
                { title: "Learning Reminders", desc: "Daily study reminders", checked: false },
                { title: "Marketing Emails", desc: "Deals and promotions", checked: false },
              ].map((row) => (
                <div className="mini-list-item" key={row.title}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{row.title}</div>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{row.desc}</div>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked={row.checked}
                    style={{ accentColor: "var(--gold)", width: 16, height: 16, cursor: "pointer" }}
                  />
                </div>
              ))}
            </div>
            <button className="btn btn-primary" style={{ marginTop: 20 }} type="button">
              Save Preferences
            </button>
          </div>
        </div>

        <div className={`dash-page${activePanel === "ai-chat" ? " active" : ""}`}>
          <div className="dash-top">
            <div>
              <div className="dash-top-title">Admin Support Chat 💬</div>
              <div className="dash-top-sub">Send message to admin and get replies here</div>
            </div>
          </div>

          <div className="d-card chat-wrap">
            <div className="chat-msgs">
              {chatMsgs.map((m) => (
                <div
                  key={m.id}
                  style={{
                    marginBottom: 12,
                    display: "flex",
                    justifyContent: m.senderRole === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "80%",
                      padding: "12px 14px",
                      borderRadius: 12,
                      background: m.senderRole === "user" ? "var(--gold)" : "var(--bg-card-alt)",
                      color: m.senderRole === "user" ? "var(--text-inverse)" : "var(--text-primary)",
                      border: m.senderRole === "user" ? "none" : "1px solid var(--border-default)",
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.85, marginBottom: 4 }}>
                      {m.senderRole === "user" ? "You" : m.senderName}
                    </div>
                    <div style={{ fontSize: 14, lineHeight: 1.45 }}>{m.text}</div>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <div className="chat-input-row">
              <input
                className="input-field"
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Write your message for admin..."
                style={{ flex: 1 }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendChatMsg();
                }}
              />
              <button className="btn btn-primary" type="button" onClick={() => sendChatMsg()}>
                Send →
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
