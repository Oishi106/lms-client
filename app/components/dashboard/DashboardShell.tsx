"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

import {
  getInitialUserAdminChat,
  saveUserAdminChat,
  subscribeUserAdminChat,
  type UserAdminChatMessage,
} from "@/app/lib/user-admin-chat";
import { appendAdminNotification } from "@/app/lib/admin-notifications";
import {
  clearAllUserNotifications,
  deleteUserNotification,
  getUserNotifications,
  markAllUserNotificationsRead,
  subscribeUserNotifications,
  type UserNotification,
} from "@/app/lib/user-notifications";
import { getPaidOrders, PAYMENTS_UPDATED_EVENT, ORDERS_STORAGE_KEY } from "@/app/lib/payments-data";
import { getCourseHref, useCatalogCourses, type CatalogCourse } from "@/app/lib/course-catalog";
import {
  getCourseLearningProgress,
  LEARNING_PROGRESS_STORAGE_KEY,
  LEARNING_PROGRESS_UPDATED_EVENT,
} from "@/app/lib/learning-progress-data";
import {
  getStoredWishlist,
  toggleWishlistCourse,
  WISHLIST_STORAGE_KEY,
  WISHLIST_UPDATED_EVENT,
} from "@/app/lib/wishlist-data";
import {
  getReviewsByEmail,
  REVIEW_STORAGE_KEY,
  REVIEW_UPDATED_EVENT,
} from "@/app/lib/review-data";

type Panel =
  | "ov"
  | "courses"
  | "videos"
  | "profile"
  | "reviews-d"
  | "users"
  | "manage-courses"
  | "wishlist"
  | "orders"
  | "analytics"
  | "settings"
  | "notifications"
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
  const { data: session } = useSession();
  const user = session?.user;
  const { courses: catalogCourses } = useCatalogCourses();

  const [activePanel, setActivePanel] = useState<Panel>("ov");
  const [profileSaved, setProfileSaved] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  const [chatMsgs, setChatMsgs] = useState<UserAdminChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const profilePhotoInputRef = useRef<HTMLInputElement | null>(null);
  const [userNotifications, setUserNotifications] = useState<UserNotification[]>([]);
  const [refreshToken, setRefreshToken] = useState(0);
  const [wishlistRevision, setWishlistRevision] = useState(0);
  const [reviewRevision, setReviewRevision] = useState(0);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!user) router.replace("/login");
  }, [user, router]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMsgs]);

  useEffect(() => {
    setChatMsgs(getInitialUserAdminChat());
    return subscribeUserAdminChat(() => setChatMsgs(getInitialUserAdminChat()));
  }, []);

  useEffect(() => {
    setUserNotifications(getUserNotifications());
    return subscribeUserNotifications(() => setUserNotifications(getUserNotifications()));
  }, []);

  useEffect(() => {
    const sync = () => setRefreshToken((value) => value + 1);
    const onStorage = (event: StorageEvent) => {
      const key = event.key || "";
      if (
        key === ORDERS_STORAGE_KEY ||
        key.startsWith(`${ORDERS_STORAGE_KEY}:`) ||
        key === LEARNING_PROGRESS_STORAGE_KEY ||
        key.startsWith(`${LEARNING_PROGRESS_STORAGE_KEY}:`) ||
        key === WISHLIST_STORAGE_KEY ||
        key.startsWith(`${WISHLIST_STORAGE_KEY}:`) ||
        event.key === REVIEW_STORAGE_KEY
      ) {
        sync();
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(PAYMENTS_UPDATED_EVENT, sync);
    window.addEventListener(LEARNING_PROGRESS_UPDATED_EVENT, sync);
    window.addEventListener(WISHLIST_UPDATED_EVENT, sync);
    window.addEventListener(REVIEW_UPDATED_EVENT, sync);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(PAYMENTS_UPDATED_EVENT, sync);
      window.removeEventListener(LEARNING_PROGRESS_UPDATED_EVENT, sync);
      window.removeEventListener(WISHLIST_UPDATED_EVENT, sync);
      window.removeEventListener(REVIEW_UPDATED_EVENT, sync);
    };
  }, []);

  const displayName = user?.name ?? "Learner";
  const currentUserEmail = user?.email?.trim().toLowerCase() ?? "";
  const profilePhotoStorageKey = currentUserEmail ? `skillforge_profile_photo:${currentUserEmail}` : "";

  useEffect(() => {
    if (!profilePhotoStorageKey) {
      setProfilePhoto(null);
      return;
    }

    const savedPhoto = window.localStorage.getItem(profilePhotoStorageKey);
    setProfilePhoto(savedPhoto || null);
  }, [profilePhotoStorageKey]);

  const purchasedCourses = useMemo(() => {
    void refreshToken;

    const orders = getPaidOrders(currentUserEmail).filter((order) => Boolean(order.buyerEmail?.trim()));
    const dedupedOrders = Array.from(new Map(orders.map((order) => [order.courseId, order])).values());

    return dedupedOrders
      .map((order) => {
        const matchedCourse = catalogCourses.find((course) => course.id === order.courseId || course.slug === order.courseId);
        return {
          order,
          course: matchedCourse,
        };
      })
      .filter((item): item is { order: (typeof dedupedOrders)[number]; course: CatalogCourse } => Boolean(item.course));
  }, [catalogCourses, currentUserEmail, refreshToken]);

  const unlockedVideos = useMemo(() => {
    void refreshToken;

    const orders = getPaidOrders(currentUserEmail)
      .filter((order) => Boolean(order.buyerEmail?.trim()))
      .sort((left, right) => right.createdAt - left.createdAt);

    const seen = new Set<string>();

    return orders
      .map((order) => {
      const matchedCourse = catalogCourses.find((course) => course.id === order.courseId || course.slug === order.courseId);
      const bookingDate = new Date(order.createdAt);
      const videoUrl = order.videoUrl?.trim() || matchedCourse?.videoUrl || "";

      return {
        order,
        course: matchedCourse,
        videoUrl,
        dateLabel: Number.isNaN(bookingDate.getTime())
          ? "Recently"
          : bookingDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        statusLabel: "Unlocked",
        statusClass: "pill pill-teal",
      };
      })
      .filter(({ videoUrl }) => {
        if (!videoUrl) return false;
        if (seen.has(videoUrl)) return false;
        seen.add(videoUrl);
        return true;
      });
  }, [catalogCourses, currentUserEmail, refreshToken]);

  const learningProgressCourses = useMemo(
    () =>
      purchasedCourses
        .map(({ order, course }) => {
          const progress = getCourseLearningProgress(course.id || order.courseId, currentUserEmail);
          const isComplete = progress >= 100;
          const isStarted = progress > 0;

          return {
            order,
            course,
            progress,
            progressLabel: isComplete ? "Done" : `${progress}%`,
            progressWidth: `${progress}%`,
            status: isComplete ? "Completed" : isStarted ? "In Progress" : "Not started",
            statusClass: isComplete ? "pill pill-teal" : isStarted ? "pill pill-gold" : "pill pill-rose",
            action: isComplete ? "Review" : isStarted ? "Resume" : "Start",
            colorBg:
              course.accent === "teal"
                ? "var(--teal-dim)"
                : course.accent === "rose"
                  ? "var(--rose-dim)"
                  : course.accent === "violet"
                    ? "var(--violet-dim)"
                    : course.accent === "green"
                      ? "rgba(34,197,94,0.12)"
                      : "var(--gold-dim)",
            colorText:
              course.accent === "teal"
                ? "var(--teal)"
                : course.accent === "rose"
                  ? "var(--rose)"
                  : course.accent === "violet"
                    ? "var(--violet)"
                    : course.accent === "green"
                      ? "rgb(34,197,94)"
                      : "var(--gold)",
          };
        })
        .sort((left, right) => right.progress - left.progress || right.order.createdAt - left.order.createdAt),
    [purchasedCourses]
  );

  const overallProgress = learningProgressCourses.length
    ? Math.round(
        learningProgressCourses.reduce((sum, item) => sum + item.progress, 0) / learningProgressCourses.length
      )
    : 0;
  const completedCourses = learningProgressCourses.filter((item) => item.progress >= 100).length;
  const activeCourses = learningProgressCourses.filter((item) => item.progress > 0 && item.progress < 100).length;
  const wishlistedCourses = useMemo(() => {
    void wishlistRevision;

    const wishlistMap = getStoredWishlist(currentUserEmail);

    return Object.entries(wishlistMap)
      .map(([courseId, addedAt]) => {
        const course = catalogCourses.find((item) => item.id === courseId || item.slug === courseId);
        if (!course) return null;

        return { course, addedAt };
      })
      .filter((item): item is { course: CatalogCourse; addedAt: number } => Boolean(item))
      .sort((left, right) => right.addedAt - left.addedAt);
  }, [catalogCourses, currentUserEmail, wishlistRevision]);

  useEffect(() => {
    const syncReviews = () => setReviewRevision((value) => value + 1);
    const onStorage = (event: StorageEvent) => {
      if (event.key === REVIEW_STORAGE_KEY) syncReviews();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(REVIEW_UPDATED_EVENT, syncReviews);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(REVIEW_UPDATED_EVENT, syncReviews);
    };
  }, []);

  useEffect(() => {
    const syncWishlist = () => setWishlistRevision((value) => value + 1);
    const onStorage = (event: StorageEvent) => {
      const key = event.key || "";
      if (key === WISHLIST_STORAGE_KEY || key.startsWith(`${WISHLIST_STORAGE_KEY}:`)) syncWishlist();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(WISHLIST_UPDATED_EVENT, syncWishlist);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(WISHLIST_UPDATED_EVENT, syncWishlist);
    };
  }, []);

  if (!user) return null;

  const userName = user.name ?? "Learner";
  const userEmail = user.email ?? "";
  const userInitials = user.initials ?? "U";
  void reviewRevision;
  const userReviews = currentUserEmail ? getReviewsByEmail(currentUserEmail) : [];
  const firstName = userName.split(" ")[0] ?? userName;
  const lastName = userName.split(" ").slice(1).join(" ");

  const handleChangePhotoClick = () => {
    profilePhotoInputRef.current?.click();
  };

  const handleProfilePhotoSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !profilePhotoStorageKey) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 2 * 1024 * 1024) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      if (!result) return;
      setProfilePhoto(result);
      window.localStorage.setItem(profilePhotoStorageKey, result);
    };
    reader.readAsDataURL(file);
  };

  function sendChatMsg() {
    const msg = chatInput.trim();
    if (!msg || !user) return;

    const nextMessage: UserAdminChatMessage = {
      id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      senderRole: "user",
      senderName: userName,
      text: msg,
      createdAt: Date.now(),
    };

    const updated = saveUserAdminChat([...chatMsgs, nextMessage]);
    setChatMsgs(updated);
    appendAdminNotification({
      type: "message",
      title: "New User Message",
      description: `${userName} sent a new support message.`,
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
            active={activePanel === "videos"}
            icon="▶️"
            label="Unlocked Videos"
            badge={unlockedVideos.length ? String(unlockedVideos.length) : undefined}
            onClick={() => setActivePanel("videos")}
          />
          <SidebarLink
            active={activePanel === "wishlist"}
            icon="♡"
            label="Saved for Later"
            badge={wishlistedCourses.length ? String(wishlistedCourses.length) : undefined}
            onClick={() => setActivePanel("wishlist")}
          />
          <SidebarLink
            active={activePanel === "profile"}
            icon="👤"
            label="My Profile"
            onClick={() => setActivePanel("profile")}
          />
          <SidebarLink
            active={activePanel === "notifications"}
            icon="🔔"
            label="Notifications"
            badge={userNotifications.filter((item) => !item.read).length ? String(userNotifications.filter((item) => !item.read).length) : undefined}
            onClick={() => setActivePanel("notifications")}
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
              <div className="ov-value text-gold">{purchasedCourses.length}</div>
              <div className="ov-change">↑ +2 this month</div>
            </div>
            <div className="ov-card">
              <div className="ov-icon-wrap" style={{ background: "var(--teal-dim)" }}>
                ✅
              </div>
              <div className="ov-label">Completed</div>
              <div className="ov-value" style={{ color: "var(--teal)" }}>
                {completedCourses}
              </div>
              <div className="ov-change">{activeCourses} still active</div>
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
                {completedCourses}
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
              <h3>Learning Progress</h3>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                  {overallProgress}% average completion across your enrolled courses
                </div>
                <div className="pill pill-teal">{completedCourses}/{learningProgressCourses.length || 0} done</div>
              </div>
              {learningProgressCourses.length === 0 ? (
                <div style={{ color: "var(--text-secondary)", padding: "18px 0" }}>
                  Enroll in a course to start tracking your progress here.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {learningProgressCourses.slice(0, 4).map((courseRow) => (
                    <div key={courseRow.course.id} style={{ display: "grid", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {courseRow.course.title}
                          </div>
                          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                            {courseRow.course.instructorName} · {courseRow.course.duration}
                          </div>
                        </div>
                        <span className={courseRow.statusClass}>{courseRow.status}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ flex: 1, height: 6, borderRadius: 999, background: "var(--border-subtle)", overflow: "hidden" }}>
                          <div
                            style={{
                              width: courseRow.progressWidth,
                              height: "100%",
                              borderRadius: 999,
                              background:
                                courseRow.course.accent === "teal"
                                  ? "var(--teal)"
                                  : courseRow.course.accent === "rose"
                                    ? "var(--rose)"
                                    : courseRow.course.accent === "violet"
                                      ? "var(--violet)"
                                      : courseRow.course.accent === "green"
                                        ? "#22c55e"
                                        : "var(--gold)",
                            }}
                          />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)" }}>
                          {courseRow.progressLabel}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                    <th>Progress</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {learningProgressCourses.map((c) => (
                    <tr key={c.course.id}>
                      <td>
                        <div className="user-cell-row">
                          <div
                            className="u-avatar-sm"
                            style={{ background: c.colorBg, color: c.colorText }}
                          >
                            {c.course.icon}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700 }}>{c.course.title}</div>
                            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{c.course.instructorName}</div>
                          </div>
                        </div>
                      </td>
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
                                    c.course.accent === "teal"
                                      ? "var(--teal)"
                                      : c.course.accent === "rose"
                                        ? "var(--rose)"
                                        : c.course.accent === "violet"
                                          ? "var(--violet)"
                                          : c.course.accent === "green"
                                            ? "#22c55e"
                                            : "var(--gold)",
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
                        <button className="action-sm" type="button" onClick={() => router.push(getCourseHref(c.course))}>
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
            {purchasedCourses.length === 0 ? (
              <div style={{ padding: "32px 20px", textAlign: "center", color: "var(--text-secondary)" }}>
                <div style={{ fontSize: 44, marginBottom: 12 }}>📚</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
                  No enrolled courses yet
                </div>
                <div style={{ marginBottom: 18 }}>Your purchased courses will appear here after checkout.</div>
                <button className="btn btn-primary" type="button" onClick={() => router.push("/explore") }>
                  Browse Courses
                </button>
              </div>
            ) : (
              <table className="d-table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Instructor</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {purchasedCourses.map(({ order, course }) => (
                    <tr key={`mc-${order.courseId}`}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div
                            style={{
                              width: 42,
                              height: 42,
                              borderRadius: 12,
                              overflow: "hidden",
                              flexShrink: 0,
                              background: "var(--bg-card)",
                              border: "1px solid var(--border-subtle)",
                            }}
                          >
                            {course?.thumbnail ? (
                              <div style={{ width: "100%", height: "100%", backgroundImage: `url(${course.thumbnail})`, backgroundSize: "cover", backgroundPosition: "center" }} />
                            ) : (
                              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                {course?.icon || "📘"}
                              </div>
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700 }}>{course?.title || order.courseTitle}</div>
                            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{order.amount}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: "var(--text-secondary)" }}>
                        {course?.instructorName || course?.instructor || "SkillForge Instructor"}
                      </td>
                      <td>
                        <span className="pill pill-teal">Unlocked</span>
                      </td>
                      <td>
                        <Link className="btn btn-primary btn-sm" href={getCourseHref(course || { id: order.courseId, slug: order.courseId })}>
                          Continue Learning
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className={`dash-page${activePanel === "wishlist" ? " active" : ""}`}>
          <div className="dash-top">
            <div>
              <div className="dash-top-title">Saved for Later</div>
              <div className="dash-top-sub">Courses you want to revisit or enroll in later</div>
            </div>
          </div>

          <div className="d-card">
            {wishlistedCourses.length === 0 ? (
              <div style={{ padding: "32px 20px", textAlign: "center", color: "var(--text-secondary)" }}>
                <div style={{ fontSize: 44, marginBottom: 12 }}>♡</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
                  Your wishlist is empty
                </div>
                <div style={{ marginBottom: 18 }}>Save courses from Explore or a course page to keep them here.</div>
                <button className="btn btn-primary" type="button" onClick={() => router.push("/explore") }>
                  Browse Courses
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 14 }}>
                {wishlistedCourses.map(({ course, addedAt }) => (
                  <div key={course.id} style={{ display: "flex", gap: 14, alignItems: "center", justifyContent: "space-between", padding: 14, borderRadius: 14, border: "1px solid var(--border-default)", background: "var(--bg-card-alt)", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", gap: 14, alignItems: "center", minWidth: 0 }}>
                      <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--gold-dim)", color: "var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                        {course.icon}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {course.title}
                        </div>
                        <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
                          {course.instructorName} · {course.duration} · Saved {new Date(addedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <Link className="btn btn-primary btn-sm" href={getCourseHref(course)}>
                        Open Course
                      </Link>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => toggleWishlistCourse(course.id, currentUserEmail)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={`dash-page${activePanel === "videos" ? " active" : ""}`}>
          <div className="dash-top">
            <div>
              <div className="dash-top-title">Unlocked Videos</div>
            </div>
          </div>
          <div className="d-card">
            {unlockedVideos.length === 0 ? (
              <div style={{ padding: "32px 20px", textAlign: "center", color: "var(--text-secondary)" }}>
                <div style={{ fontSize: 44, marginBottom: 12 }}>▶️</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
                  No unlocked videos yet
                </div>
                <div style={{ marginBottom: 18 }}>Your unlocked course videos will appear here after checkout.</div>
                <button className="btn btn-primary" type="button" onClick={() => router.push("/explore") }>
                  Explore Courses
                </button>
              </div>
            ) : (
              <table className="d-table">
                <thead>
                  <tr>
                    <th>Video</th>
                    <th>Unlocked</th>
                    <th>Course</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {unlockedVideos.map(({ order, course, dateLabel, statusLabel, statusClass }) => (
                    <tr key={`video-${order.id}`}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: 12,
                              overflow: "hidden",
                              flexShrink: 0,
                              background: "var(--bg-card)",
                              border: "1px solid var(--border-subtle)",
                            }}
                          >
                            {course?.thumbnail ? (
                              <div
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  backgroundImage: `url(${course.thumbnail})`,
                                  backgroundSize: "cover",
                                  backgroundPosition: "center",
                                }}
                              />
                            ) : (
                              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                {course?.icon || "📘"}
                              </div>
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700 }}>{course?.title || order.courseTitle}</div>
                            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                              {course?.instructorName || course?.instructor || "SkillForge Instructor"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: "var(--text-secondary)" }}>{dateLabel}</td>
                      <td style={{ color: "var(--gold)", fontWeight: 700 }}>{order.amount}</td>
                      <td>
                        <span className={statusClass}>{statusLabel}</span>
                      </td>
                      <td>
                        <Link className="btn btn-primary btn-sm" href={getCourseHref(course || { id: order.courseId, slug: order.courseId })}>
                          Watch
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className={`dash-page${activePanel === "profile" ? " active" : ""}`}>
          <div className="dash-top">
            <div>
              <div className="dash-top-title">My Profile</div>
            </div>
          </div>

          <div className="profile-grid">
            <div className="d-card profile-card">
              <div className="profile-ava-big" style={{ background: "var(--gold-dim)", color: "var(--gold)" }}>
                {profilePhoto ? (
                  <img src={profilePhoto} alt={`${userName} profile`} className="profile-photo-preview" />
                ) : (
                  userInitials
                )}
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700 }}>
                {userName}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 20 }}>
                {userEmail}
              </div>
              <button className="btn btn-ghost" style={{ width: "100%", fontSize: 13 }} type="button" onClick={handleChangePhotoClick}>
                Change Photo
              </button>
              <input
                ref={profilePhotoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                style={{ display: "none" }}
                onChange={handleProfilePhotoSelect}
              />
              <div className="profile-photo-note">PNG/JPG/WEBP, max 2MB</div>
            </div>

            <div className="d-card">
              <h3 style={{ marginBottom: 22 }}>Edit Profile</h3>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input className="input-field" defaultValue={firstName} />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input className="input-field" defaultValue={lastName} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="input-field" defaultValue={userEmail} />
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
              <div className="dash-top-sub">Your submitted course reviews and ratings</div>
            </div>
            <div className="pill pill-gold">{userReviews.length} reviews</div>
          </div>
          <div className="d-card">
            {userReviews.length === 0 ? (
              <div style={{ padding: "32px 20px", textAlign: "center", color: "var(--text-secondary)" }}>
                <div style={{ fontSize: 44, marginBottom: 12 }}>⭐</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
                  You haven’t written any reviews yet
                </div>
                <div style={{ marginBottom: 18 }}>Open a course and add your review from the Reviews tab.</div>
                <button className="btn btn-primary" type="button" onClick={() => router.push("/explore") }>
                  Find Courses to Review
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 14 }}>
                {userReviews.map((review) => (
                  <div
                    key={`${review.courseId}-${review.userEmail}`}
                    style={{
                      border: "1px solid var(--border-default)",
                      borderRadius: 14,
                      background: "var(--bg-card-alt)",
                      padding: 16,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>{review.courseTitle}</div>
                        <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                          {new Date(review.updatedAt).toLocaleDateString()} · {review.userName}
                        </div>
                      </div>
                      <div style={{ color: "var(--gold)", fontWeight: 700 }}>{"★".repeat(review.rating)}</div>
                    </div>

                    <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>{review.title}</div>
                    <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.6, marginBottom: 14 }}>
                      {review.comment}
                    </p>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <Link className="btn btn-primary btn-sm" href={getCourseHref({ id: review.courseId })}>
                        Open Course
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
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

        <div className={`dash-page${activePanel === "notifications" ? " active" : ""}`}>
          <div className="dash-top">
            <div>
              <div className="dash-top-title">Notifications</div>
              <div className="dash-top-sub">Replies from admin and system updates</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-secondary btn-sm" type="button" onClick={() => setUserNotifications(markAllUserNotificationsRead())}>
                Mark all read
              </button>
              <button className="btn btn-ghost btn-sm" type="button" onClick={() => setUserNotifications(clearAllUserNotifications())}>
                Clear all
              </button>
            </div>
          </div>

          <div className="d-card">
            {userNotifications.length === 0 ? (
              <p style={{ color: "var(--text-secondary)" }}>No notifications yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {userNotifications.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      border: "1px solid var(--border-default)",
                      borderRadius: 12,
                      padding: 14,
                      background: item.read ? "var(--bg-card-alt)" : "var(--gold-dim)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 6 }}>
                      <strong style={{ fontSize: 14 }}>{item.title}</strong>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>{new Date(item.createdAt).toLocaleString()}</span>
                        <button className="btn btn-ghost btn-sm" type="button" onClick={() => setUserNotifications(deleteUserNotification(item.id))}>
                          Delete
                        </button>
                      </div>
                    </div>
                    <p style={{ color: "var(--text-secondary)", margin: 0 }}>{item.description}</p>
                  </div>
                ))}
              </div>
            )}
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
