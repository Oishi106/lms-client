"use client";

import { useEffect, useState } from "react";
import { COURSES, type Course } from "@/app/lib/courses-data";

type ApiInstructor = {
  name: string;
  role: string;
  avatar: string;
};

type ApiRating = {
  score: number;
  totalReviews: number;
};

type ApiDetails = {
  totalLessons: number;
  duration: string;
  level: string;
};

type ApiPricing = {
  amount: number;
  currency: string;
  discountPrice: number;
};

export type ApiCourse = {
  instructor: ApiInstructor;
  rating: ApiRating;
  details: ApiDetails;
  pricing: ApiPricing;
  _id: string;
  id: string;
  title: string;
  slug: string;
  thumbnail: string;
  category: string;
  isBestseller: boolean;
  previewVideo?: string;
  __v: number;
  createdAt: string;
  updatedAt: string;
};

export type CatalogCourse = Course & {
  slug: string;
  thumbnail: string;
  category: string;
  instructorName: string;
  instructorRole: string;
  instructorAvatar: string;
  totalReviews: number;
  totalLessons: number;
  pricingAmount: number;
  discountPrice: number;
  isBestseller: boolean;
  apiLevel: string;
};

const API_URL = "/api/courses";

const compactNumber = (value: number): string => {
  if (value >= 1_000_000) {
    const scaled = value / 1_000_000;
    return `${scaled % 1 === 0 ? scaled.toFixed(0) : scaled.toFixed(1).replace(/\.0$/, "")}m`;
  }

  if (value >= 1_000) {
    const scaled = value / 1_000;
    return `${scaled % 1 === 0 ? scaled.toFixed(0) : scaled.toFixed(1).replace(/\.0$/, "")}k`;
  }

  return `${value}`;
};

const formatPrice = (value: number): string => {
  if (!Number.isFinite(value)) return "$0";
  return `$${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}`;
};

const parsePriceValue = (value: string): number => {
  const numeric = Number.parseFloat(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
};

const parseReviewValue = (value: string): number => {
  const raw = value.trim().toLowerCase();
  const numeric = Number.parseFloat(raw.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(numeric)) return 0;
  if (raw.includes("m")) return numeric * 1_000_000;
  if (raw.includes("k")) return numeric * 1_000;
  return numeric;
};

const pickFallbackCourse = (tag: string): Course => {
  const fallback = COURSES.find((course) => course.tag === tag);
  return fallback ?? COURSES[0];
};

const mapCategoryToTag = (category: string): string => {
  const normalized = category.toLowerCase();

  if (normalized.includes("design")) return "Design";
  if (normalized.includes("data")) return "Data Science";
  if (normalized.includes("ai") || normalized.includes("machine")) return "AI & ML";
  if (
    normalized.includes("devops") ||
    normalized.includes("cloud") ||
    normalized.includes("security") ||
    normalized.includes("software") ||
    normalized.includes("web") ||
    normalized.includes("mobile") ||
    normalized.includes("development")
  ) {
    return "Development";
  }
  if (normalized.includes("marketing") || normalized.includes("business")) return "Business";

  return "Development";
};

const mapTagToAccent = (tag: string): Course["accent"] => {
  if (tag === "Design") return "rose";
  if (tag === "AI & ML") return "violet";
  if (tag === "Data Science") return "green";
  if (tag === "Business") return "gold";
  return "teal";
};

const mapLevel = (level: string): Course["level"] => {
  const normalized = level.toLowerCase();

  if (normalized.includes("intermediate")) return "INTERMEDIATE";
  if (normalized.includes("advanced")) return "ADVANCED";
  if (normalized.includes("expert")) return "EXPERT";
  return "BEGINNER";
};

const hashString = (value: string): number => {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
};

const getAvatarPalette = (seed: string): { primary: string; secondary: string; accent: string; text: string } => {
  const palettes = [
    { primary: "#1f2937", secondary: "#f5c842", accent: "#2ee8cf", text: "#f8f7f2" },
    { primary: "#0f172a", secondary: "#a78bfa", accent: "#f5c842", text: "#ffffff" },
    { primary: "#111827", secondary: "#fb7185", accent: "#f59e0b", text: "#fff7ed" },
    { primary: "#0f172a", secondary: "#22c55e", accent: "#38bdf8", text: "#ecfeff" },
    { primary: "#1e1b4b", secondary: "#f97316", accent: "#facc15", text: "#fff7ed" },
  ];

  return palettes[hashString(seed) % palettes.length];
};

const buildInstructorAvatar = (name: string, role: string): string => {
  const trimmedName = name.trim() || "Instructor";
  const initials = trimmedName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "I")
    .join("");
  const palette = getAvatarPalette(`${trimmedName}-${role}`);
  const motif = hashString(`${trimmedName}-${role}-motif`) % 4;

  const iconMark = (() => {
    if (motif === 0) {
      return `
        <path d="M66 104h124l-62-42-62 42Z" fill="${palette.text}" fill-opacity="0.9" />
        <path d="M84 112v28c0 16 20 30 44 30s44-14 44-30v-28" fill="none" stroke="${palette.accent}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M92 118v22" stroke="${palette.primary}" stroke-width="8" stroke-linecap="round" />
        <path d="M164 118v22" stroke="${palette.primary}" stroke-width="8" stroke-linecap="round" />
      `;
    }

    if (motif === 1) {
      return `
        <circle cx="128" cy="116" r="42" fill="none" stroke="${palette.accent}" stroke-width="10" />
        <path d="M128 70l10 20 22 3-16 15 4 22-20-11-20 11 4-22-16-15 22-3 10-20Z" fill="${palette.text}" fill-opacity="0.92" />
      `;
    }

    if (motif === 2) {
      return `
        <path d="M76 98h28l-18 30 18 30H76l18-30-18-30Zm76 0h28l-18 30 18 30h-28l18-30-18-30Z" fill="${palette.text}" fill-opacity="0.9" />
        <path d="M112 86l-16 40 16 40" stroke="${palette.accent}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" fill="none" />
        <path d="M144 86l16 40-16 40" stroke="${palette.accent}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      `;
    }

    return `
      <circle cx="128" cy="112" r="34" fill="${palette.text}" fill-opacity="0.9" />
      <path d="M104 156h48" stroke="${palette.accent}" stroke-width="12" stroke-linecap="round" />
      <path d="M92 128c12-18 24-24 36-24s24 6 36 24" fill="none" stroke="${palette.primary}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" />
    `;
  })();

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" role="img" aria-label="${trimmedName}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${palette.primary}" />
          <stop offset="100%" stop-color="${palette.secondary}" />
        </linearGradient>
        <linearGradient id="orb" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${palette.accent}" stop-opacity="0.95" />
          <stop offset="100%" stop-color="${palette.text}" stop-opacity="0.15" />
        </linearGradient>
      </defs>
      <rect width="256" height="256" rx="48" fill="url(#bg)" />
      <circle cx="196" cy="60" r="42" fill="url(#orb)" opacity="0.9" />
      <circle cx="58" cy="190" r="34" fill="${palette.accent}" opacity="0.18" />
      <rect x="54" y="66" width="148" height="148" rx="74" fill="rgba(255,255,255,0.10)" />
      ${iconMark}
      <text x="128" y="220" text-anchor="middle" font-family="Arial, sans-serif" font-size="52" font-weight="700" fill="${palette.text}">${initials}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg.replace(/\s+/g, " ").trim())}`;
};

const buildFallbackCourses = (): CatalogCourse[] =>
  COURSES.map((course) => {
    const instructorName =
      course.instructor?.trim() || course.byline.replace(/^by\s+/i, "").split("·")[0].trim() || "SkillForge Instructor";

    return {
      ...course,
      slug: course.id,
      thumbnail: "",
      category: course.tag,
      instructorName,
      instructorRole: "Course Instructor",
      instructorAvatar: buildInstructorAvatar(instructorName, course.tag),
      totalReviews: parseReviewValue(course.reviews),
      totalLessons: Number.parseInt(course.lessons?.replace(/[^0-9]/g, "") || "0", 10) || 0,
      pricingAmount: parsePriceValue(course.oldPrice),
      discountPrice: parsePriceValue(course.price),
      isBestseller: false,
      apiLevel: course.level,
    };
  });

const normalizeApiCourse = (item: ApiCourse, index: number): CatalogCourse => {
  const tag = mapCategoryToTag(item.category);
  const fallback = pickFallbackCourse(tag);
  const level = mapLevel(item.details.level);

  return {
    ...fallback,
    id: item.id || fallback.id || `course-${index + 1}`,
    slug: item.slug || item.id || fallback.id || `course-${index + 1}`,
    level,
    accent: mapTagToAccent(tag),
    icon: fallback.icon,
    tag,
    rating: Number.isFinite(item.rating.score) ? item.rating.score.toFixed(1) : fallback.rating,
    reviews: compactNumber(item.rating.totalReviews),
    title: item.title?.trim() || fallback.title,
    byline: `by ${item.instructor.name} · ${compactNumber(item.rating.totalReviews)} reviews`,
    duration: item.details.duration?.trim() || fallback.duration,
    price: formatPrice(item.pricing.discountPrice),
    oldPrice: formatPrice(item.pricing.amount),
    lessons: `${item.details.totalLessons} lectures`,
    instructor: item.instructor.name,
    certificate: fallback.certificate,
    language: fallback.language,
    access: fallback.access,
    description: fallback.description,
    learnings: fallback.learnings,
    relatedCourses: fallback.relatedCourses,
    videoUrl: item.previewVideo?.trim() || fallback.videoUrl,
    previewSeconds: fallback.previewSeconds,
    thumbnail: item.thumbnail?.trim() || "",
    category: item.category,
    instructorName: item.instructor.name,
    instructorRole: item.instructor.role,
    instructorAvatar: item.instructor.avatar?.trim() || buildInstructorAvatar(item.instructor.name, item.instructor.role),
    totalReviews: item.rating.totalReviews,
    totalLessons: item.details.totalLessons,
    pricingAmount: item.pricing.amount,
    discountPrice: item.pricing.discountPrice,
    isBestseller: item.isBestseller,
    apiLevel: item.details.level,
  };
};

export const getCourseHref = (course: { slug?: string; id: string }): string => `/course/${course.slug || course.id}`;

export const createFallbackCourseCatalog = (): CatalogCourse[] => buildFallbackCourses();

export const normalizeRemoteCourseCatalog = (courses: ApiCourse[]): CatalogCourse[] =>
  courses.map((course, index) => normalizeApiCourse(course, index));

export function useCatalogCourses() {
  const [courses, setCourses] = useState<CatalogCourse[]>(() => buildFallbackCourses());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadCourses = async () => {
      try {
        const response = await fetch(API_URL, {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Unable to load courses (${response.status})`);
        }

        const payload = (await response.json()) as { ok?: boolean; courses?: ApiCourse[] };
        if (!payload?.ok || !Array.isArray(payload.courses)) {
          throw new Error("Unexpected courses response");
        }

        const normalized = normalizeRemoteCourseCatalog(payload.courses);
        if (normalized.length > 0) {
          setCourses(normalized);
          setError(null);
        }
      } catch (loadError) {
        if (controller.signal.aborted) return;
        setError(loadError instanceof Error ? loadError.message : "Failed to load courses");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void loadCourses();

    return () => {
      controller.abort();
    };
  }, []);

  return { courses, loading, error };
}
