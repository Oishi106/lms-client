"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { hasPurchasedCourse } from "@/app/lib/payments-data";

interface CoursePurchaseActionsProps {
  courseId: string;
  price: string;
  courseTitle?: string;
  videoUrl?: string;
}

export default function CoursePurchaseActions({ courseId, price, courseTitle, videoUrl }: CoursePurchaseActionsProps) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const currentUserEmail = session?.user?.email?.trim().toLowerCase() ?? "";
  const [purchased, setPurchased] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPurchased(isAdmin || hasPurchasedCourse(courseId, currentUserEmail));
  }, [courseId, currentUserEmail, isAdmin]);

  // পেমেন্ট হ্যান্ডলার ফাংশন
  const handleEnrollClick = async () => {
    try {
      setLoading(true);

      if (isAdmin) {
        alert('Admin cannot purchase courses.');
        return;
      }

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          courseName: courseTitle || "Course Enrollment",
          price: parseFloat(price.replace(/[^0-9.]/g, "")),
          customerEmail: session?.user?.email || '',
          videoUrl,
        }),
      });

      const checkoutSession = await response.json();

      if (checkoutSession?.url) {
        window.location.assign(checkoutSession.url);
      } else {
        alert('Unable to start checkout.');
      }
    } catch (error) {
      console.error("Payment Error:", error);
      alert("Something went wrong with the payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (purchased) {
    return (
      <div style={{ display: "flex", gap: "12px" }}>
        <Link href="/dashboard" className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }}>
          Continue Learning
        </Link>
        <button className="btn btn-secondary" style={{ flex: 1, justifyContent: "center" }} type="button">
          Try Free Preview
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: "12px" }}>
      <button
        onClick={handleEnrollClick}
        disabled={loading}
        className="btn btn-primary"
        style={{ flex: 1, justifyContent: "center" }}
      >
        {loading ? "Processing..." : `Enroll Now - ${price}`}
      </button>
      
      <button className="btn btn-secondary" style={{ flex: 1, justifyContent: "center" }} type="button">
        Try Free Preview
      </button>
    </div>
  );
}