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
      <header className="sticky top-0 z-50 h-16 border-b border-hairline bg-canvas/95 backdrop-blur-sm transition-all duration-200">
        <div className="mx-auto flex h-full max-w-[1400px] items-center justify-between px-6">
          {/* Left: Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group focus-visible:ring-1 focus-visible:ring-primary focus:outline-none"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-canvas border border-hairline text-primary font-mono text-sm font-bold transition-colors group-hover:border-hairline-strong">
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
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
            <Link
              href="/#features"
              className={`text-xs font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:text-primary flex items-center h-full px-1 border-b-2 ${
                "border-transparent text-body hover:text-ink"
              }`}
            >
              Features
            </Link>
            <Link
              href="/#architecture"
              className={`text-xs font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:text-primary flex items-center h-full px-1 border-b-2 ${
                "border-transparent text-body hover:text-ink"
              }`}
            >
              Architecture
            </Link>
            <Link
              href="/dashboard"
              className={`text-xs font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:text-primary flex items-center h-full px-1 border-b-2 ${
                activeTab === "dashboard"
                  ? "border-primary text-primary font-semibold"
                  : "border-transparent text-body hover:text-ink"
              }`}
            >
              Playground
            </Link>
            <Link
              href="/docs/getting-started"
              className={`text-xs font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:text-primary flex items-center h-full px-1 border-b-2 ${
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
              className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-hairline bg-canvas hover:bg-canvas-soft text-body hover:text-ink transition-colors cursor-pointer focus-visible:ring-1 focus-visible:ring-primary focus:outline-none"
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
              className="hidden sm:inline-flex items-center justify-center rounded-[6px] border border-hairline bg-canvas hover:bg-canvas-soft transition-colors px-3 h-8 text-xs font-semibold text-body hover:text-ink focus-visible:ring-1 focus-visible:ring-primary focus:outline-none"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="stark-btn-primary rounded-[6px] px-4 h-8 text-xs font-semibold focus-visible:ring-1 focus-visible:ring-primary focus:outline-none inline-flex items-center justify-center"
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
          </nav>
        </div>
      )}
    </>
  );
}
