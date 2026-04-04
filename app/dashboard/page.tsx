'use client';

import { Navbar } from "../components/landing";
import DashboardShell from "../components/dashboard/DashboardShell";
import AdminDashboard from "../components/dashboard/AdminDashboard";
import { useSession } from "next-auth/react";

export default function DashboardPage() {
  const { data: session, status } = useSession();

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
