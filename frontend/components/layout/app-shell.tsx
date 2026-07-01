"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import {
  canAccessPath,
  defaultPathForRole,
  getStoredUser,
  StoredUser,
} from "@/lib/permissions";



export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<StoredUser | null>(null);
  const publicRoutes = ["/login", "/forgot-password", "/reset-password"];
  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = getStoredUser();
    setUser(storedUser);

    if (token && storedUser && !canAccessPath(storedUser.role, pathname)) {
      router.replace(defaultPathForRole(storedUser.role));
      return;
    }

    if (pathname === "/") {
      router.replace(
        token && storedUser ? defaultPathForRole(storedUser.role) : "/login"
      );
      return;
    }

    if (!isPublicRoute && !token) {
      router.replace("/login");
      return;
    }

    if (isPublicRoute && token) {
      router.replace(
        storedUser ? defaultPathForRole(storedUser.role) : "/dashboard"
      );
      return;
    }

    setChecking(false);
  }, [isPublicRoute, pathname, router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500">Loading CRM...</p>
      </div>
    );
  }

  if (isPublicRoute) return <>{children}</>;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="flex-1 min-w-0">
        <header className="h-16 border-b bg-white px-8 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">
              Customer Relationship Management
            </p>
            <h2 className="font-semibold">CRM Workspace</h2>
          </div>

          <div className="text-sm text-slate-600">
            {user && (
              <span className="ml-2 rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold">
                {user.role}
              </span>
            )}
          </div>
        </header>

        <main className="min-w-0 overflow-x-hidden p-8">{children}</main>
      </div>
    </div>
  );
}
