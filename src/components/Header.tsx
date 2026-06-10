"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Sun, Moon, Menu, ChevronRight } from "lucide-react";

export function Header() {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getActiveTab = () => {
    if (pathname.startsWith("/docs")) return "docs";
    if (pathname.startsWith("/dashboard")) return "dashboard";
    return "";
  };

  const activeTab = getActiveTab();

  return (
    <>
      <header className="sticky top-0 z-50 h-14 border-b border-hairline bg-canvas/90 backdrop-blur-xl transition-all duration-200">
        <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between px-5 sm:px-6">
          {/* Left: Logo */}
          <Link
            href="/"
            className="group flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-[5px] border border-hairline bg-canvas-soft text-primary font-mono text-sm font-bold transition-colors group-hover:border-hairline-strong">
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M12 2L2 22h20L12 2zm0 4l6.5 13h-13L12 6z" />
              </svg>
            </div>
            <span className="font-sans text-[13px] font-semibold tracking-[-0.02em] text-ink">
              LogStrata
            </span>
            <span className="hidden border-l border-hairline pl-2 font-mono text-[8px] uppercase tracking-[0.14em] text-mute sm:inline">control plane</span>
          </Link>

          {/* Middle: Nav Links (Desktop) */}
          <nav className="hidden h-full items-center gap-7 md:flex">
            <Link
              href="/#features"
              className={`flex h-full items-center border-b px-0.5 text-[11px] font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:text-primary ${
                "border-transparent text-body hover:text-ink"
              }`}
            >
              Features
            </Link>
            <Link
              href="/#architecture"
              className={`flex h-full items-center border-b px-0.5 text-[11px] font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:text-primary ${
                "border-transparent text-body hover:text-ink"
              }`}
            >
              Architecture
            </Link>
            <Link
              href="/dashboard"
              className={`flex h-full items-center border-b px-0.5 text-[11px] font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:text-primary ${
                activeTab === "dashboard"
                  ? "border-primary text-primary font-semibold"
                  : "border-transparent text-body hover:text-ink"
              }`}
            >
              Playground
            </Link>
            <Link
              href="/docs/getting-started"
              className={`flex h-full items-center border-b px-0.5 text-[11px] font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:text-primary ${
                activeTab === "docs"
                  ? "border-primary text-primary font-semibold"
                  : "border-transparent text-body hover:text-ink"
              }`}
            >
              Docs
            </Link>
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-[5px] border border-hairline bg-canvas text-body transition-colors hover:bg-canvas-soft hover:text-ink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              aria-label="Toggle visual theme"
            >
              {resolvedTheme === "dark" ? (
                <Sun className="h-3.5 w-3.5" />
              ) : (
                <Moon className="h-3.5 w-3.5" />
              )}
            </button>

            <Link
              href="/login"
              className="hidden h-7 items-center justify-center px-2 text-[11px] font-medium text-body transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary sm:inline-flex"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="stark-btn-primary inline-flex h-7 items-center justify-center rounded-[5px] px-3 text-[11px] font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
            >
              Sign Up
            </Link>

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
        <div className="fixed inset-x-0 top-14 z-40 border-b border-hairline bg-canvas px-6 py-4 shadow-diffused transition-all duration-200 md:hidden">
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
          </nav>
        </div>
      )}
    </>
  );
}
