"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { hasPurchasedCourse } from "@/app/lib/payments-data";

interface CoursePurchaseActionsProps {
  courseId: string;
  price: string;
  courseTitle?: string; // কোর্সের নাম পাঠানোর জন্য (optional কিন্তু ভালো)
}

export default function CoursePurchaseActions({ courseId, price, courseTitle }: CoursePurchaseActionsProps) {
  const [purchased, setPurchased] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPurchased(hasPurchasedCourse(courseId));
  }, [courseId]);

  // পেমেন্ট হ্যান্ডলার ফাংশন
  const handleEnrollClick = async () => {
    try {
      setLoading(true);
      
      // ১. আমাদের তৈরি করা API-তে রিকোয়েস্ট পাঠানো
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: courseId,
          courseName: courseTitle || "Course Enrollment",
          // price যদি স্ট্রিং হিসেবে আসে (যেমন "$50"), তবে শুধু সংখ্যাটা নিতে হবে
          price: parseFloat(price.replace(/[^0-9.]/g, "")), 
        }),
      });

      const session = await response.json();

      if (session?.url) {
        // Redirect the user to the Stripe Checkout page
        window.location.assign(session.url);
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