import { NextResponse } from "next/server";
import { COURSES } from "@/app/lib/courses-data";

const BACKEND_URL = "https://lms-server-1-jmha.onrender.com/api/v1/get-courses";

const parsePriceValue = (value: string): number => {
  const parsed = Number.parseFloat(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseReviewValue = (value: string): number => {
  const normalized = value.trim().toLowerCase();
  const parsed = Number.parseFloat(normalized.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(parsed)) return 0;
  if (normalized.includes("m")) return parsed * 1_000_000;
  if (normalized.includes("k")) return parsed * 1_000;
  return parsed;
};

const buildFallbackApiCourses = () =>
  COURSES.map((course) => ({
    _id: course.id,
    id: course.id,
    title: course.title,
    slug: course.id,
    thumbnail: "",
    category: course.tag,
    isBestseller: false,
    previewVideo: course.videoUrl,
    __v: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    instructor: {
      // ফিক্স করা লাইন: ?? এবং || একসাথে ব্যবহারের জন্য ব্র্যাকেট দেওয়া হয়েছে
      name: (course.instructor ?? course.byline.replace(/^by\s+/i, "").split("·")[0].trim()) || "SkillForge Instructor",
      role: "Course Instructor",
      avatar: "",
    },
    rating: {
      score: Number.parseFloat(course.rating) || 0,
      totalReviews: parseReviewValue(course.reviews),
    },
    details: {
      totalLessons: Number.parseInt(course.lessons?.replace(/[^0-9]/g, "") || "0", 10) || 0,
      duration: course.duration,
      level: course.level,
    },
    pricing: {
      amount: parsePriceValue(course.oldPrice),
      currency: "USD",
      discountPrice: parsePriceValue(course.price),
    },
  }));

export async function GET() {
  try {
    const response = await fetch(BACKEND_URL, {
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json({ ok: true, courses: buildFallbackApiCourses() });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ ok: true, courses: buildFallbackApiCourses() });
  }
}