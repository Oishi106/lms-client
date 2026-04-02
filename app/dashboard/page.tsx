'use client';

import { Navbar } from "../components/landing";
import DashboardShell from "../components/dashboard/DashboardShell";
import AdminDashboard from "../components/dashboard/AdminDashboard";
import { useAuth } from "../providers";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      <Navbar />
      <main>
        {user?.role === 'admin' ? <AdminDashboard /> : <DashboardShell />}
      </main>
    </>
  );
}
