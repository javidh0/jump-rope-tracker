import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jump Rope Tracker",
  description: "Track jump rope sessions, goals, and progress.",
};

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/log", label: "Log Session" },
  { href: "/timer", label: "Timer" },
  { href: "/workouts", label: "Workouts" },
  { href: "/sessions", label: "History" },
  { href: "/progress", label: "Progress" },
  { href: "/goals", label: "Goals" },
  { href: "/settings", label: "Settings" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <header className="border-b border-zinc-200 dark:border-zinc-800">
          <nav className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
            <span className="font-semibold tracking-tight">🪢 Jump Rope</span>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
