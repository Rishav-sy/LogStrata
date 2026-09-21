"use client";

import React, { useState, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Sun, Moon, Menu, ChevronRight } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface HeaderNavLinkProps {
  href: string;
  label: string;
  isActive: boolean;
}

function HeaderNavLink({ href, label, isActive }: HeaderNavLinkProps) {
  return (
    <Link
      href={href}
      className={`text-xs font-medium transition-all duration-200 focus-visible:outline-none flex items-center h-full px-1 border-b-2 ${
        isActive ? "border-primary text-primary font-semibold" : "border-transparent text-body"
      } group`}
    >
      <div className="relative inline-block overflow-hidden h-4 flex items-center">
        <div className="flex flex-col transition-transform duration-300 ease-out transform group-hover:-translate-y-1/2">
          <span className={isActive ? "text-primary font-semibold" : "text-body group-hover:text-ink"}>
            {label}
          </span>
          <span className="text-primary font-semibold">
            {label}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Check active session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const getDisplayName = (email: string | undefined) => {
    if (!email) return "";
    const part = email.split("@")[0];
    const nameOnly = part.replace(/[0-9]/g, "");
    return nameOnly.charAt(0).toUpperCase() + nameOnly.slice(1);
  };

  const getActiveTab = () => {
    if (pathname.startsWith("/docs")) return "docs";
    if (pathname.startsWith("/dashboard")) return "dashboard";
    return "";
  };

  const activeTab = getActiveTab();

  return (
    <>
      <header className="sticky top-0 z-50 h-16 border-b border-hairline bg-canvas/95 backdrop-blur-sm transition-all duration-200">
        <div className="mx-auto flex h-full max-w-[1400px] items-center justify-between px-6">
          {/* Left: Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group focus-visible:ring-1 focus-visible:ring-primary focus:outline-none"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-canvas border border-hairline text-primary font-mono text-sm font-bold transition-colors group-hover:border-hairline-strong">
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" xmlns="http://www-w3-org.sandbox.google.com/2000/svg" aria-hidden="true">
                <path d="M12 2L2 22h20L12 2zm0 4l6.5 13h-13L12 6z" />
              </svg>
            </div>
            <span className="font-sans text-sm font-bold tracking-tight text-ink">
              LogStrata
            </span>
            <span className="border border-hairline px-1.5 py-0.5 font-mono text-[9px] uppercase text-mute tracking-wider rounded-[4px]">
              v1.0.0
            </span>
          </Link>

          {/* Middle: Nav Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 h-full">
            <HeaderNavLink
              href="/#features"
              label="Features"
              isActive={false}
            />
            <HeaderNavLink
              href="/#architecture"
              label="Architecture"
              isActive={false}
            />
            <HeaderNavLink
              href="/dashboard"
              label="Playground"
              isActive={activeTab === "dashboard"}
            />
            <HeaderNavLink
              href="/docs/getting-started"
              label="Docs"
              isActive={activeTab === "docs"}
            />
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-2.5">
            {/* GitHub Repo Button */}
            <a
              href="https://github.com/Rishav-sy/LogStrata"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 items-center gap-1.5 px-2.5 rounded-[6px] border border-hairline bg-canvas hover:bg-canvas-soft text-body hover:text-ink transition-colors text-xs font-mono focus-visible:ring-1 focus-visible:ring-primary focus:outline-none"
              aria-label="GitHub Repository"
            >
              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span className="hidden sm:inline text-[11px] font-medium">GitHub</span>
            </a>

            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-hairline bg-canvas hover:bg-canvas-soft text-body hover:text-ink transition-colors cursor-pointer focus-visible:ring-1 focus-visible:ring-primary focus:outline-none"
              aria-label="Toggle visual theme"
            >
              {mounted && resolvedTheme === "dark" ? (
                <Sun className="h-3.5 w-3.5" />
              ) : (
                <Moon className="h-3.5 w-3.5" />
              )}
            </button>

            {mounted && user ? (
              <div className="flex items-center gap-3 bg-canvas-soft border border-hairline px-3 py-1 rounded-[6px] text-xs font-mono h-8">
                <span className="text-ink font-bold">{getDisplayName(user.email)}</span>
                <span className="text-hairline h-4 border-r border-hairline" />
                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                    router.push("/login");
                  }}
                  className="text-mute hover:text-ink transition-colors cursor-pointer font-bold underline"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-100 transition-all duration-200 px-4 h-8 text-xs font-semibold border border-zinc-900 dark:border-transparent shadow-sm focus-visible:ring-1 focus-visible:ring-primary focus:outline-none"
              >
                Log In
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex h-8 w-8 items-center justify-center rounded-[6px] border border-hairline bg-canvas hover:bg-canvas-soft text-body transition-colors focus-visible:ring-1 focus-visible:ring-primary focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Dropdown Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 z-40 border-b border-hairline bg-canvas px-6 py-4 shadow-diffused transition-all duration-200">
          <nav className="flex flex-col gap-2">
            <Link
              href="/#features"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between rounded-[6px] px-3 py-2 text-xs font-medium text-body hover:text-ink hover:bg-canvas-soft"
            >
              <span>Features</span>
              <ChevronRight className="h-3.5 w-3.5 text-mute" />
            </Link>
            <Link
              href="/#architecture"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between rounded-[6px] px-3 py-2 text-xs font-medium text-body hover:text-ink hover:bg-canvas-soft"
            >
              <span>Architecture</span>
              <ChevronRight className="h-3.5 w-3.5 text-mute" />
            </Link>
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between rounded-[6px] px-3 py-2 text-xs font-medium text-body hover:text-ink hover:bg-canvas-soft"
            >
              <span>Playground</span>
              <ChevronRight className="h-3.5 w-3.5 text-mute" />
            </Link>
            <Link
              href="/docs/getting-started"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between rounded-[6px] px-3 py-2 text-xs font-medium text-body hover:text-ink hover:bg-canvas-soft"
            >
              <span>Docs</span>
              <ChevronRight className="h-3.5 w-3.5 text-mute" />
            </Link>
            <a
              href="https://github.com/Rishav-sy/LogStrata"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between rounded-[6px] px-3 py-2 text-xs font-medium text-body hover:text-ink hover:bg-canvas-soft"
            >
              <span className="flex items-center gap-2">
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                GitHub Repository
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-mute" />
            </a>
          </nav>
        </div>
      )}
    </>
  );
}
