"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStaffToken } from "@/lib/staff-api";

interface StaffGuardProps {
  children: React.ReactNode;
}

export default function StaffGuard({ children }: StaffGuardProps) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = getStaffToken();
    if (!token) {
      router.replace("/staff/login");
    } else {
      setChecked(true);
    }
  }, [router]);

  if (!checked) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#eef4fa", fontFamily: "Arial, sans-serif" }}
      >
        <span className="text-sm text-gray-500">Wird geladen…</span>
      </div>
    );
  }

  return <>{children}</>;
}
