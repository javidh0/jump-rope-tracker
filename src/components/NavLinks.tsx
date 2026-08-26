"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
      {navLinks.map((link) => {
        const active = isActive(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "font-semibold text-zinc-950 underline underline-offset-4 dark:text-white"
                : "text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
            }
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}
