import type { Metadata } from "next";
import { JetBrains_Mono, Geist } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Header } from "@/components/Header";
import Link from "next/link";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "LogStrata — Log-First Kubernetes Autoscaling & DevSecOps",
  description:
    "Intelligent log-driven autoscaling, metrics parsing, and automated security analytics for Kubernetes clusters.",
  keywords: ["kubernetes", "autoscaling", "logging", "observability", "devops", "prometheus", "security"],
  openGraph: {
    title: "LogStrata — Log-First Kubernetes Autoscaling & DevSecOps",
    description:
      "Intelligent log-driven autoscaling, metrics parsing, and automated security analytics for Kubernetes clusters.",
    type: "website",
    url: "https://logstrata.io",
  },
  twitter: {
    card: "summary_large_image",
    title: "LogStrata — Log-First Kubernetes Autoscaling & DevSecOps",
    description:
      "Intelligent log-driven autoscaling, metrics parsing, and automated security analytics for Kubernetes clusters.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("scroll-smooth", jetbrainsMono.variable, "font-sans", geist.variable)}
      suppressHydrationWarning
    >
      <body className="bg-canvas text-ink font-sans selection:bg-primary selection:text-on-primary min-h-screen flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <Header />
          <main className="flex-grow min-h-[calc(100vh-16rem)]">{children}</main>

          {/* Footer */}
          <footer className="border-t border-hairline bg-canvas py-16 px-6">
            <div className="mx-auto max-w-[1280px]">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-4 mb-12">
                {/* Column 1: Info */}
                <div className="col-span-2 flex flex-col gap-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-canvas border border-hairline text-primary font-mono text-sm font-bold">
                      <svg
                        className="h-4 w-4 fill-current"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                      >
                        <path d="M12 2L2 22h20L12 2zm0 4l6.5 13h-13L12 6z" />
                      </svg>
                    </div>
                    <span className="font-sans text-sm font-bold tracking-tight text-ink">
                      LogStrata
                    </span>
                  </div>
                  <p className="text-xs text-body max-w-sm leading-relaxed">
                    LogStrata is an advanced, security-aware Kubernetes logging, analytics, and auto-scaling control plane. Designed for high availability, compliance, and instant responsiveness.
                  </p>
                </div>

                {/* Column 2: Product */}
                <div className="flex flex-col gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-mute font-bold">
                    Product
                  </span>
                  <ul className="flex flex-col gap-2.5 text-xs text-body">
                    <li>
                      <Link href="/#features" className="hover:text-ink transition-colors">
                        Features
                      </Link>
                    </li>
                    <li>
                      <Link href="/#architecture" className="hover:text-ink transition-colors">
                        Architecture
                      </Link>
                    </li>
                    <li>
                      <Link href="/dashboard" className="hover:text-ink transition-colors">
                        Playground
                      </Link>
                    </li>
                    <li>
                      <Link href="/docs/getting-started" className="hover:text-ink transition-colors">
                        Pricing
                      </Link>
                    </li>
                  </ul>
                </div>

                {/* Column 3: Resources */}
                <div className="flex flex-col gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-mute font-bold">
                    Resources
                  </span>
                  <ul className="flex flex-col gap-2.5 text-xs text-body">
                    <li>
                      <Link href="/docs/getting-started" className="hover:text-ink transition-colors">
                        Getting Started
                      </Link>
                    </li>
                    <li>
                      <Link href="/docs/configuration" className="hover:text-ink transition-colors">
                        Configuration
                      </Link>
                    </li>
                    <li>
                      <Link href="/docs/scaling-policies" className="hover:text-ink transition-colors">
                        Scaling Logic
                      </Link>
                    </li>
                    <li>
                      <Link href="/docs/api-reference" className="hover:text-ink transition-colors">
                        API Reference
                      </Link>
                    </li>
                  </ul>
                </div>

                {/* Column 4: Security */}
                <div className="flex flex-col gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-mute font-bold">
                    Security
                  </span>
                  <ul className="flex flex-col gap-2.5 text-xs text-body">
                    <li>
                      <Link href="/docs/security-analytics" className="hover:text-ink transition-colors">
                        Threat Defense
                      </Link>
                    </li>
                    <li>
                      <Link href="/docs/security-analytics" className="hover:text-ink transition-colors">
                        IP Blocklisting
                      </Link>
                    </li>
                    <li>
                      <Link href="/docs/security-analytics" className="hover:text-ink transition-colors">
                        Audit Logging
                      </Link>
                    </li>
                    <li>
                      <Link href="/docs/security-analytics" className="hover:text-ink transition-colors">
                        Compliance
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between border-t border-hairline pt-8 gap-4">
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-[11px] text-mute">
                  <span>© 2026 LogStrata Inc. All rights reserved.</span>
                  <span className="hidden sm:inline">•</span>
                  <Link href="/docs/getting-started" className="hover:text-ink transition-colors">
                    Documentation
                  </Link>
                </div>
              </div>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
