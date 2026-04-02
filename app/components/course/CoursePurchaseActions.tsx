"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { hasPurchasedCourse } from "@/app/lib/payments-data";

interface CoursePurchaseActionsProps {
  courseId: string;
  price: string;
}

export default function CoursePurchaseActions({ courseId, price }: CoursePurchaseActionsProps) {
  const [purchased, setPurchased] = useState(false);

  useEffect(() => {
    setPurchased(hasPurchasedCourse(courseId));
  }, [courseId]);

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
      <Link
        href={`/checkout/${courseId}`}
        className="btn btn-primary"
        style={{ flex: 1, justifyContent: "center" }}
      >
        Enroll Now - {price}
      </Link>
      <button className="btn btn-secondary" style={{ flex: 1, justifyContent: "center" }} type="button">
        Try Free Preview
      </button>
    </div>
  );
}
