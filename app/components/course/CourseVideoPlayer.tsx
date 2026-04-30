"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import {
  ENROLLED_COURSES_STORAGE_KEY,
  PAYMENTS_UPDATED_EVENT,
  hasPurchasedCourse,
  hasPurchasedVideo,
} from "@/app/lib/payments-data";
import {
  COURSE_VIDEO_STORAGE_KEY,
  COURSE_VIDEO_UPDATED_EVENT,
  getStoredCourseVideoMap,
} from "@/app/lib/course-video-data";
import { getManagedCoursesClient } from "@/app/lib/managed-courses-data";
import {
  LEARNING_PROGRESS_STORAGE_KEY,
  LEARNING_PROGRESS_UPDATED_EVENT,
  getCourseLearningProgress,
  saveCourseLearningProgress,
} from "@/app/lib/learning-progress-data";

interface CourseVideoPlayerProps {
  courseId: string;
  videoUrl: string;
  previewSeconds?: number;
}

type YouTubePlayerInstance = {
  destroy: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
};

type YouTubePlayerStateChangeEvent = {
  data: number;
  target: YouTubePlayerInstance;
};

type YouTubePlayerOptions = {
  videoId: string;
  playerVars: Record<string, string | number>;
  events: {
    onStateChange: (event: YouTubePlayerStateChangeEvent) => void;
  };
};

type YouTubeApi = {
  Player: new (container: HTMLElement, options: YouTubePlayerOptions) => YouTubePlayerInstance;
  PlayerState: {
    PLAYING: number;
    ENDED: number;
  };
};

type WindowWithYouTube = Window & {
  YT?: YouTubeApi;
  onYouTubeIframeAPIReady?: () => void;
};

const getYoutubeVideoId = (url: string): string | null => {
  const trimmed = url.trim();

  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/);
  if (shortMatch?.[1]) return shortMatch[1];

  const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{6,})/);
  if (watchMatch?.[1]) return watchMatch[1];

  const embedMatch = trimmed.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/);
  if (embedMatch?.[1]) return embedMatch[1];

  return null;
};

export default function CourseVideoPlayer({
  courseId,
  videoUrl,
}: CourseVideoPlayerProps) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'admin';
  const currentUserEmail = session?.user?.email?.trim().toLowerCase() ?? '';
  const [purchased, setPurchased] = useState(false);
  const [activeVideoUrl, setActiveVideoUrl] = useState(videoUrl);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const htmlVideoRef = useRef<HTMLVideoElement | null>(null);
  const youtubeContainerRef = useRef<HTMLDivElement | null>(null);
  const youtubePlayerRef = useRef<YouTubePlayerInstance | null>(null);
  const youtubePollRef = useRef<number | null>(null);
  const youtubeId = useMemo(() => getYoutubeVideoId(activeVideoUrl), [activeVideoUrl]);

  const commitProgress = useCallback((nextProgress: number) => {
    setProgress((currentProgress) => {
      const normalizedProgress = Math.max(currentProgress, Math.min(100, Math.round(nextProgress)));

      if (normalizedProgress !== currentProgress) {
        saveCourseLearningProgress(courseId, normalizedProgress, currentUserEmail);
      }

      return normalizedProgress;
    });
  }, [courseId, currentUserEmail]);

  const stopYoutubePolling = useCallback(() => {
    if (youtubePollRef.current !== null) {
      window.clearInterval(youtubePollRef.current);
      youtubePollRef.current = null;
    }
  }, []);

  const updateProgressFromPlayback = useCallback((currentTime: number, duration: number) => {
    if (!Number.isFinite(currentTime) || !Number.isFinite(duration) || duration <= 0) return;

    const watchedProgress = (currentTime / duration) * 100;
    commitProgress(watchedProgress >= 100 ? 100 : watchedProgress);
  }, [commitProgress]);

  useEffect(() => {
    const applyVideoOverride = () => {
      const map = getStoredCourseVideoMap();
      setActiveVideoUrl(map[courseId]?.trim() || videoUrl);
    };

    applyVideoOverride();

    const onStorage = (event: StorageEvent) => {
      if (event.key === COURSE_VIDEO_STORAGE_KEY) applyVideoOverride();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(COURSE_VIDEO_UPDATED_EVENT, applyVideoOverride);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(COURSE_VIDEO_UPDATED_EVENT, applyVideoOverride);
    };
  }, [courseId, videoUrl]);

  useEffect(() => {
    const refreshAccess = () => {
      if (isAdmin) {
        setPurchased(true);
        return;
      }

      setPurchased(hasPurchasedCourse(courseId, currentUserEmail) || hasPurchasedVideo(activeVideoUrl, currentUserEmail));
    };

    refreshAccess();

    const onStorage = (event: StorageEvent) => {
      const key = event.key || "";
      if (key === ENROLLED_COURSES_STORAGE_KEY || key.startsWith(`${ENROLLED_COURSES_STORAGE_KEY}:`)) refreshAccess();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(PAYMENTS_UPDATED_EVENT, refreshAccess);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(PAYMENTS_UPDATED_EVENT, refreshAccess);
    };
  }, [activeVideoUrl, courseId, currentUserEmail, isAdmin]);

  useEffect(() => {
    const refreshProgress = () => setProgress(getCourseLearningProgress(courseId, currentUserEmail));

    refreshProgress();

    const onStorage = (event: StorageEvent) => {
      const key = event.key || "";
      if (key === LEARNING_PROGRESS_STORAGE_KEY || key.startsWith(`${LEARNING_PROGRESS_STORAGE_KEY}:`)) refreshProgress();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(LEARNING_PROGRESS_UPDATED_EVENT, refreshProgress);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(LEARNING_PROGRESS_UPDATED_EVENT, refreshProgress);
    };
  }, [courseId, currentUserEmail]);

  useEffect(() => {
    if (!purchased || !youtubeId) return;

    let cancelled = false;

    const createYoutubePlayer = () => {
      if (cancelled || !youtubeContainerRef.current || youtubePlayerRef.current) return;

      const ytWindow = window as WindowWithYouTube;

      if (!ytWindow.YT?.Player) return;

      youtubePlayerRef.current = new ytWindow.YT.Player(youtubeContainerRef.current, {
        videoId: youtubeId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          origin: window.location.origin,
        },
        events: {
          onStateChange: (event) => {
            if (event.data === ytWindow.YT?.PlayerState.PLAYING) {
              stopYoutubePolling();
              youtubePollRef.current = window.setInterval(() => {
                const player = youtubePlayerRef.current;
                if (!player || typeof player.getCurrentTime !== "function" || typeof player.getDuration !== "function") {
                  return;
                }

                updateProgressFromPlayback(player.getCurrentTime(), player.getDuration());
              }, 1000);
            }

            if (event.data === ytWindow.YT?.PlayerState.ENDED) {
              stopYoutubePolling();
              commitProgress(100);
            }
          },
        },
      });
    };

    const ytWindow = window as WindowWithYouTube;

    const previousReady = ytWindow.onYouTubeIframeAPIReady;
    ytWindow.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      createYoutubePlayer();
    };

    if (ytWindow.YT?.Player) {
      createYoutubePlayer();
    } else if (!document.querySelector('script[data-youtube-iframe-api="true"]')) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      script.dataset.youtubeIframeApi = "true";
      document.body.appendChild(script);
    }

    return () => {
      cancelled = true;
      stopYoutubePolling();
      ytWindow.onYouTubeIframeAPIReady = previousReady;
      youtubePlayerRef.current?.destroy?.();
      youtubePlayerRef.current = null;
    };
  }, [commitProgress, purchased, stopYoutubePolling, updateProgressFromPlayback, youtubeId]);

  useEffect(() => {
    if (!purchased || youtubeId || !htmlVideoRef.current) return;

    const videoElement = htmlVideoRef.current;

    const handleTimeUpdate = () => {
      updateProgressFromPlayback(videoElement.currentTime, videoElement.duration);
    };

    const handleEnded = () => {
      commitProgress(100);
    };

    videoElement.addEventListener("timeupdate", handleTimeUpdate);
    videoElement.addEventListener("ended", handleEnded);

    return () => {
      videoElement.removeEventListener("timeupdate", handleTimeUpdate);
      videoElement.removeEventListener("ended", handleEnded);
    };
  }, [commitProgress, purchased, updateProgressFromPlayback, youtubeId]);

  const subtitle = useMemo(() => (purchased ? "Full course video unlocked. Enjoy complete access." : "This video is locked. Purchase the course to unlock full access."), [purchased]);

  return (
    <section
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
        borderRadius: "12px",
        padding: "20px",
        marginBottom: "24px",
      }}
    >
      <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "8px" }}>
        Course Video Lesson
      </h2>
      <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "14px" }}>
        {isAdmin ? "Admin access enabled. All course videos are unlocked." : subtitle}
      </p>

      {purchased ? (
        <div
          style={{
            marginBottom: "18px",
            padding: "16px",
            borderRadius: "12px",
            border: "1px solid var(--border-subtle)",
            background: "var(--bg-card)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "10px" }}>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "4px" }}>Learning Progress</div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                Save your current progress and continue later from the dashboard.
              </div>
            </div>
            <div className="pill pill-teal">{progress >= 100 ? "Completed" : `${progress}%`}</div>
          </div>

          <div style={{ height: 8, borderRadius: 999, overflow: "hidden", background: "var(--border-subtle)", marginBottom: 12 }}>
            <div style={{ width: `${progress}%`, height: "100%", borderRadius: 999, background: "var(--teal)" }} />
          </div>

          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            Progress updates automatically while you watch the lesson.
          </div>
        </div>
      ) : null}

      <div
        style={{
          borderRadius: "12px",
          overflow: "hidden",
          border: "1px solid var(--border-default)",
          background: "#000",
        }}
      >
        {purchased ? (
          youtubeId ? (
            <div
              ref={youtubeContainerRef}
              style={{ width: "100%", height: "460px", display: "block" }}
            />
          ) : (
            <video
              ref={htmlVideoRef}
              src={activeVideoUrl}
              controls
              style={{ width: "100%", display: "block", maxHeight: "460px" }}
            />
          )
        ) : (
          <div style={{ width: "100%", height: 460, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", background: "linear-gradient(90deg, rgba(0,0,0,0.7), rgba(0,0,0,0.9))" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Video Locked</div>
              <div style={{ color: "var(--text-secondary)", marginBottom: 12 }}>Purchase the course to access full videos.</div>
              <button className="btn btn-primary" onClick={async () => {
                if (loading) return;
                try {
                  setLoading(true);
                  if (session?.user?.role === 'admin') {
                    alert('Admin cannot purchase courses.');
                    return;
                  }

                  const managed = getManagedCoursesClient();
                  const course = managed.find((c) => c.id === courseId);
                  const price = course?.price || "0";

                  const res = await fetch('/api/checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      courseId,
                      courseName: course?.title || 'Course Enrollment',
                      price: parseFloat(String(price).replace(/[^0-9.]/g, '')) || 0,
                      customerEmail: session?.user?.email || '',
                    })
                  });

                  const data = await res.json();
                  if (data?.url) {
                    window.location.assign(data.url);
                  } else {
                    alert('Unable to start checkout.');
                  }
                } catch (err) {
                  console.error(err);
                  alert('Payment failed.');
                } finally {
                  setLoading(false);
                }
              }}>
                {loading ? 'Processing...' : 'Enroll Now'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* No preview UI — videos are locked until purchase */}
    </section>
  );
}
