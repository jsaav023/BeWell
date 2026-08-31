"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BeeMark } from "@/components/BeeMark";

const links = [
  { href: "/", label: "Home" },
  { href: "/calendar", label: "Calendar" },
  { href: "/history", label: "History" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-[var(--surface)]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {links.map((link) => {
          const active =
            link.href === "/"
              ? pathname === "/"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-1 flex-col items-center gap-1 py-3 text-[0.7rem] font-medium tracking-wide transition-colors ${
                active
                  ? "text-[var(--accent-deep)]"
                  : "text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              {link.href === "/" ? (
                <BeeMark
                  size={18}
                  className={active ? "opacity-100" : "opacity-45"}
                />
              ) : (
                <span
                  className={`h-1 w-1 rounded-full transition-all ${
                    active
                      ? "scale-100 bg-[var(--honey)]"
                      : "scale-0 bg-transparent"
                  }`}
                  aria-hidden
                />
              )}
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
