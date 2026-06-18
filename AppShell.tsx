"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import { ToastProvider } from "./providers/ToastProvider";
import ProgressBar from "./ui/ProgressBar";
import { useAuth } from "@/components/providers/AuthProvider";
import { getClientRuntimeConfig } from "@/lib/runtimeConfig";

// Simple cookie helpers (SameSite=Lax)
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const parts = document.cookie ? document.cookie.split("; ") : [];
  for (const p of parts) {
    const [k, ...rest] = p.split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}
function setCookie(name: string, value: string, days = 365) {
  if (typeof document === "undefined") return;
  const d = new Date(Date.now() + days * 864e5);
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${d.toUTCString()}; path=/; SameSite=Lax${(typeof location !== "undefined" && location.protocol === "https:") ? "; Secure" : ""}`;
}

function EnvBadge() {
  const env = getClientRuntimeConfig().ENV_LABEL || "Local";
  return <span className="text-xs bg-white/10 px-2 py-0.5 rounded">{env}</span>;
}

function UserChip() {
  const auth = useAuth();
  const name = auth.enabled && auth.isAuthenticated
    ? (auth.user?.fullName || auth.profile?.name || auth.profile?.username || "User")
    : "Unknown User";

  const initials = name
    .split(" ")
    .map(n => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-center gap-2">
      <span className="max-w-[220px] truncate text-sm uppercase">{name}</span>
      <div className="w-8 h-8 rounded-full border border-white flex items-center justify-center text-sm">
        {initials}
      </div>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof document !== "undefined") {
      const v = getCookie("casrr_sidebar_collapsed");
      if (v === "true" || v === "false") return v === "true";
    }
    return false;
  });
  const [pinned, setPinned] = useState<boolean>(() => {
    if (typeof document !== "undefined") {
      const v = getCookie("casrr_sidebar_pinned");
      if (v === "true" || v === "false") return v === "true";
    }
    return true;
  });
 
  const canAdmin = auth.enabled && auth.isAuthenticated && !!auth.user?.isAdmin;
 
  // Persist sidebar states to cookies on change
  useEffect(() => {
    try { setCookie("casrr_sidebar_collapsed", String(collapsed)); } catch {}
  }, [collapsed]);
  useEffect(() => {
    try { setCookie("casrr_sidebar_pinned", String(pinned)); } catch {}
  }, [pinned]);

  return (
    <ToastProvider>
      <div className="h-screen flex flex-col">
      <header className="bg-brand-primary text-white sticky top-0 z-40">
        <div className="flex items-center justify-between py-0.5 px-4">
          <div className="flex items-center gap-3 whitespace-nowrap">
            <Link href="/" aria-label="Go to Home" className="inline-flex items-center">
              <Image
                src="/assets/FHB_Logo.png"
                alt="First Horizon Bank"
                width={700}
                height={175}
                priority
                className="h-14 w-auto object-contain"
              />
            </Link>
            <span className="text-sm sm:text-base font-semibold truncate max-w-[360px]">
              CASRR – Credit Assurance Risk Review System
            </span>
          </div>
          <div className="flex items-center gap-4">
            {canAdmin && (
              <Link href="/admin/users" className="text-white/90 hover:text-white" aria-label="User Maintenance" title="User Maintenance">
                ⚙
              </Link>
            )}
            {auth.enabled && auth.isAuthenticated && (
              <button
                className="text-white/90 hover:text-white"
                aria-label="Logout"
                title="Logout"
                onClick={auth.signOut}
              >
                ⎋
              </button>
            )}
            <UserChip />
            <EnvBadge />
          </div>
        </div>
      </header>
      <ProgressBar />
      <div className="flex flex-1 min-h-0">
        <Sidebar
          collapsed={collapsed}
          pinned={pinned}
          onToggle={() => setCollapsed(v => !v)}
          onSetCollapsed={setCollapsed}
          onTogglePinned={() => setPinned(v => !v)}
        />
        <main className="flex-1 min-w-0 min-h-0 overflow-x-hidden overflow-y-auto scrollbar-default scrollbar-gutter-stable p-4 md:p-6 pb-16">
          <div className="mx-auto w-full min-h-0 flex flex-col flex-1">{children}</div>
        </main>
      </div>
      <footer className="bg-slate-900 text-white border-t border-slate-800 sticky bottom-0 z-40">
        <div className="flex items-center justify-between py-2 px-4 text-xs">
          <div className="text-[11px] text-white/90">
            © {new Date().getFullYear()} First Horizon Bank. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
    </ToastProvider>
  );
}
