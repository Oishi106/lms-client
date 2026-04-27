"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar from "@/app/components/landing/Navbar";
import { getDefaultManagedCourses, getManagedCoursesClient, subscribeManagedCourses } from "@/app/lib/managed-courses-data";
import { savePaidOrder, savePendingCheckout, type CourseOrder } from "@/app/lib/payments-data";

export default function CheckoutPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { data: session } = useSession();
  const user = session?.user;

  const coursesSnapshot = useSyncExternalStore(
    subscribeManagedCourses,
    () => JSON.stringify(getManagedCoursesClient()),
    () => JSON.stringify(getDefaultManagedCourses())
  );
  const managedCourses = useMemo(() => JSON.parse(coursesSnapshot) as ReturnType<typeof getDefaultManagedCourses>, [coursesSnapshot]);
  const course = useMemo(() => managedCourses.find((c) => c.id === params.id), [managedCourses, params.id]);
  const [fullName, setFullName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);

  if (user?.role === 'admin') {
    return (
      <>
        <Navbar />
        <main style={{ paddingTop: 90 }}>
          <div className="container" style={{ textAlign: "center", padding: "60px 20px" }}>
            <h1>Admin cannot purchase courses.</h1>
          </div>
        </main>
      </>
    );
  }

  if (!course) {
    return (
      <>
        <Navbar />
        <main style={{ paddingTop: 90 }}>
          <div className="container" style={{ textAlign: "center", padding: "60px 20px" }}>
            <h1>Course not found</h1>
          </div>
        </main>
      </>
    );
  }

  const handlePay = () => {
    if (!fullName.trim() || !email.trim() || !cardNumber.trim() || !expiry.trim() || !cvv.trim()) {
      setError("Please fill all payment fields.");
      return;
    }

    setError("");
    setPaying(true);

    const order: CourseOrder = {
      id: `ord-${Date.now()}`,
      courseId: course.id,
      courseTitle: course.title,
      amount: course.price,
      buyerName: fullName.trim(),
      buyerEmail: email.trim(),
      videoUrl: course.videoUrl,
      createdAt: Date.now(),
      status: "paid",
    };

    window.setTimeout(() => {
      savePendingCheckout({
        courseId: course.id,
        courseTitle: course.title,
        amount: course.price,
        buyerName: fullName.trim(),
        buyerEmail: email.trim(),
        videoUrl: course.videoUrl,
        createdAt: Date.now(),
      });
      savePaidOrder(order);
      void fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });
      router.push(`/course/${course.id}`);
    }, 900);
  };

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 90, minHeight: "100vh" }}>
        <div className="container" style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 24, alignItems: "start" }}>
          <section style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: 14, padding: 24 }}>
            <h1 style={{ fontSize: 30, marginBottom: 18 }}>Secure Checkout</h1>
            <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>
              Complete payment to enroll in this course.
            </p>

            <div style={{ display: "grid", gap: 12 }}>
              <input className="input-field" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full Name" />
              <input className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Address" />
              <input className="input-field" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="Card Number" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <input className="input-field" value={expiry} onChange={(e) => setExpiry(e.target.value)} placeholder="MM/YY" />
                <input className="input-field" value={cvv} onChange={(e) => setCvv(e.target.value)} placeholder="CVV" />
              </div>
            </div>

            {error && <p style={{ color: "var(--danger)", marginTop: 12 }}>{error}</p>}

            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={handlePay} type="button" disabled={paying}>
              {paying ? "Processing Payment..." : `Pay ${course.price}`}
            </button>
          </section>

          <aside style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: 14, padding: 24, position: "sticky", top: 96 }}>
            <h3 style={{ marginBottom: 14 }}>Order Summary</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 28 }}>{course.icon}</span>
              <strong>{course.title}</strong>
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>{course.byline}</p>
            <div style={{ borderTop: "1px solid var(--border-subtle)", margin: "14px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span>Course Price</span>
              <strong>{course.price}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)", fontSize: 14 }}>
              <span>Discounted from</span>
              <span style={{ textDecoration: "line-through" }}>{course.oldPrice}</span>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
