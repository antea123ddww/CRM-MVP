"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getStoredUser, visibleMenuItems } from "@/lib/permissions";
import { apiFetch } from "@/services/api";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = getStoredUser();
  const menuItems = user ? visibleMenuItems(user.role) : [];

  useEffect(() => {
    menuItems.forEach((item) => router.prefetch(item.href));
  }, [menuItems, router]);

  async function logout() {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("csrfToken");
      localStorage.removeItem("user");
      router.replace("/login");
    }
  }

  return (
    <aside className="w-72 shrink-0 min-h-screen bg-slate-950 text-white flex flex-col">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white text-slate-950 flex items-center justify-center font-bold">
            C
          </div>
          <div>
            <h1 className="text-xl font-bold">CRM MVP</h1>
            <p className="text-xs text-slate-400">Sales Management System</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onMouseEnter={() => router.prefetch(item.href)}
              className={`block rounded-xl px-4 py-3 text-sm transition ${
                active
                  ? "bg-white text-slate-950 font-semibold"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={logout}
          className="w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold hover:bg-red-700"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
