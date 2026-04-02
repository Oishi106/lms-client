"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
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
  previewSeconds = 30,
}: CourseVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [purchased, setPurchased] = useState(false);
  const [hitPreviewLimit, setHitPreviewLimit] = useState(false);
  const [activeVideoUrl, setActiveVideoUrl] = useState(videoUrl);

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
      setPurchased(hasPurchasedCourse(courseId));
      setHitPreviewLimit(false);
    };

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

  const subtitle = useMemo(() => {
    if (purchased) return "Full course video unlocked. Enjoy complete access.";
    return `Preview mode: first ${previewSeconds} seconds only. Complete payment to watch full video.`;
  }, [purchased, previewSeconds]);

  const youtubeId = useMemo(() => getYoutubeVideoId(activeVideoUrl), [activeVideoUrl]);
  const youtubeEmbedUrl = useMemo(() => {
    if (!youtubeId) return "";

    const base = `https://www.youtube-nocookie.com/embed/${youtubeId}`;
    const params = new URLSearchParams({ rel: "0", modestbranding: "1" });
    if (!purchased) {
      params.set("start", "0");
      params.set("end", String(previewSeconds));
    }

    return `${base}?${params.toString()}`;
  }, [youtubeId, purchased, previewSeconds]);

  const onTimeUpdate = () => {
    if (purchased || !videoRef.current) return;

    if (videoRef.current.currentTime >= previewSeconds) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setHitPreviewLimit(true);
    }
  };

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
        {youtubeId ? (
          <iframe
            title="Course video"
            src={youtubeEmbedUrl}
            style={{ width: "100%", height: "460px", border: "0", display: "block" }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          <video
            ref={videoRef}
            src={activeVideoUrl}
            controls
            onTimeUpdate={onTimeUpdate}
            style={{ width: "100%", display: "block", maxHeight: "460px" }}
          />
        )}
      </div>

      {!purchased && (
        <div style={{ marginTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <span style={{ color: "var(--gold)", fontSize: "13px", fontWeight: 600 }}>
            {hitPreviewLimit ? "Preview ended. Unlock full video by enrolling." : "Preview active"}
          </span>
          <Link className="btn btn-primary" href={`/checkout/${courseId}`}>
            Unlock Full Video
          </Link>
        </div>
      )}
    </section>
  );
}
