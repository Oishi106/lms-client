"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ENROLLED_COURSES_STORAGE_KEY,
  PAYMENTS_UPDATED_EVENT,
  hasPurchasedCourse,
} from "@/app/lib/payments-data";
import {
  COURSE_VIDEO_STORAGE_KEY,
  COURSE_VIDEO_UPDATED_EVENT,
  getStoredCourseVideoMap,
} from "@/app/lib/course-video-data";
import { getManagedCoursesClient } from "@/app/lib/managed-courses-data";

interface CourseVideoPlayerProps {
  courseId: string;
  videoUrl: string;
  previewSeconds?: number;
}

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
  previewSeconds = 300,
}: CourseVideoPlayerProps) {
  const [purchased, setPurchased] = useState(false);
  const [activeVideoUrl, setActiveVideoUrl] = useState(videoUrl);
  const [loading, setLoading] = useState(false);

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
    const refreshAccess = () => setPurchased(hasPurchasedCourse(courseId));

    refreshAccess();

    const onStorage = (event: StorageEvent) => {
      if (event.key === ENROLLED_COURSES_STORAGE_KEY) refreshAccess();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(PAYMENTS_UPDATED_EVENT, refreshAccess);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(PAYMENTS_UPDATED_EVENT, refreshAccess);
    };
  }, [courseId]);

  const subtitle = useMemo(() => (purchased ? "Full course video unlocked. Enjoy complete access." : "This video is locked. Purchase the course to unlock full access."), [purchased]);

  const youtubeId = useMemo(() => getYoutubeVideoId(activeVideoUrl), [activeVideoUrl]);
  const youtubeEmbedUrl = useMemo(() => {
    if (!youtubeId) return "";

    const base = `https://www.youtube-nocookie.com/embed/${youtubeId}`;
    const params = new URLSearchParams({ rel: "0", modestbranding: "1" });
    return `${base}?${params.toString()}`;
  }, [youtubeId, purchased, previewSeconds]);

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
        {subtitle}
      </p>

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
            <iframe
              title="Course video"
              src={youtubeEmbedUrl}
              style={{ width: "100%", height: "460px", border: "0", display: "block" }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          ) : (
            <video src={activeVideoUrl} controls style={{ width: "100%", display: "block", maxHeight: "460px" }} />
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
                  // find course info to send price/title
                  const managed = getManagedCoursesClient();
                  const course = managed.find((c) => c.id === courseId);
                  const price = course?.price || "0";
                  const parsedPrice = parseFloat(String(price).replace(/[^0-9.]/g, "")) || 0;

                  const res = await fetch('/api/checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ courseId, courseName: course?.title || 'Course Enrollment', price: parsedPrice })
                  });

                  const data = await res.json();
                  if (data?.url) {
                    window.location.assign(data.url);
                  } else {
                    console.error('Checkout failed', data);
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
