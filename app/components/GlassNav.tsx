"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/app/lib/supabase/client";
import {
  LayoutGrid,
  Users,
  BookOpen,
  ShoppingBag,
  FlaskConical,
  Trophy,
  LogOut,
  Menu,
  X,
  Zap,
  Settings,
  Layers3,
} from "lucide-react";
const items = [
  ["dashboard", "Home", LayoutGrid],
  ["notes", "Notes", BookOpen],
  ["projects", "Projects", FlaskConical],
  ["events", "Events", Zap],
  ["marketplace", "Shop", ShoppingBag],
  ["societies", "Societies", Users],
  ["leaderboard", "Leaderboard", Trophy],
] as const;
export function GlassNav() {
  const pathname = usePathname(),
    [open, setOpen] = useState(false),
    toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [open]);
  async function logout() {
    if (!window.confirm("Sign out of your account?")) return;
    await createClient().auth.signOut();
    window.location.href = "/";
  }
  return (
    <header className="mentron-topnav">
      <div className="mentron-nav-inner">
        <Link className="mentron-nav-brand" href="/mentron/dashboard">
          <Layers3 size={24} />
          Mentron
        </Link>
        <button
          ref={toggle}
          className="mentron-menu-button"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          aria-controls="mentron-navigation"
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
        <nav
          id="mentron-navigation"
          className="mentron-nav-links"
          data-open={open}
          aria-label="Mentron"
        >
          {items.map(([path, label, Icon]) => (
            <Link
              href={"/mentron/" + path}
              key={path}
              aria-current={
                pathname.startsWith("/mentron/" + path) ? "page" : undefined
              }
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="mentron-nav-actions" data-open={open}>
          <Link href="/mentron/settings" aria-label="Settings">
            <Settings size={18} />
            <span className="md:sr-only">Settings</span>
          </Link>
          <button onClick={logout} aria-label="Sign out">
            <LogOut size={18} />
            <span className="md:sr-only">Sign out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
