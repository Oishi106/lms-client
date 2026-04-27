'use client';

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "../components/landing";
import DashboardShell from "../components/dashboard/DashboardShell";
import AdminDashboard from "../components/dashboard/AdminDashboard";
import { useSession } from "next-auth/react";
import { clearPendingCheckout, getPendingCheckout, savePaidOrder, type CourseOrder } from "@/app/lib/payments-data";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const confirmationRanRef = useRef(false);

  useEffect(() => {
    const success = searchParams.get('success') === 'true';
    const sessionId = searchParams.get('session_id');

    if (!success || confirmationRanRef.current) return;

    confirmationRanRef.current = true;

    const pendingCheckout = getPendingCheckout();
    const payload = sessionId ? { sessionId } : pendingCheckout ? { order: pendingCheckout } : null;

    if (!payload) {
      confirmationRanRef.current = false;
      return;
    }

    void fetch('/api/checkout/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(async (response) => {
        const data = (await response.json().catch(() => null)) as { ok?: boolean; order?: CourseOrder } | null;
        if (response.ok && data?.order) {
          savePaidOrder(data.order);
        }
      })
      .catch(() => {
        confirmationRanRef.current = false;
      })
      .finally(() => {
        clearPendingCheckout();
      });
  }, [searchParams]);

  if (status === "loading") return null;

  const user = session?.user;

  return (
    <>
      <Navbar />
      <main>
        {user?.role === 'admin' ? <AdminDashboard /> : <DashboardShell />}
      </main>
    </>
  );
}
