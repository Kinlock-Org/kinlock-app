"use client";

import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { t } from "@/lib/i18n/messages";

const LINKS = [
  { href: "/send", key: "nav.send" as const },
  { href: "/request", key: "nav.request" as const },
  { href: "/verify", key: "nav.verify" as const },
];

const navLinkClass = (active: boolean) =>
  `text-sm font-medium transition-colors motion-reduce:transition-none ${
    active ? "text-accent" : "text-ink/70 hover:text-accent"
  }`;

/**
 * Desktop navigation links with client-side active route highlighting.
 * Extracted as a client island so SiteHeader remains a Server Component (M3-18, Issue #41).
 */
export function DesktopNavLinks() {
  const pathname = usePathname();
  return (
    <>
      {LINKS.map((link) => (
        <a
          key={link.href}
          href={link.href}
          aria-current={pathname === link.href ? "page" : undefined}
          className={navLinkClass(pathname === link.href)}
        >
          {t(link.key)}
        </a>
      ))}
    </>
  );
}

/**
 * Mobile disclosure hamburger button and slide-down menu panel.
 * Contains only the interactive state needed for disclosure and route change collapse.
 */
export function MobileMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: closes the menu on route change
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        ref={toggleRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={open ? t("nav.closeMenu") : t("nav.openMenu")}
        className="flex h-10 w-10 items-center justify-center md:hidden"
      >
        <span className="relative block h-3.5 w-5" aria-hidden="true">
          <span
            className={`absolute inset-x-0 top-0 h-0.5 rounded-full bg-ink transition-transform motion-reduce:transition-none ${
              open ? "translate-y-[6px] rotate-45" : ""
            }`}
          />
          <span
            className={`absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-ink transition-opacity motion-reduce:transition-none ${
              open ? "opacity-0" : "opacity-100"
            }`}
          />
          <span
            className={`absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-ink transition-transform motion-reduce:transition-none ${
              open ? "-translate-y-[6px] -rotate-45" : ""
            }`}
          />
        </span>
      </button>

      {open ? (
        <nav
          id={menuId}
          aria-label={t("app.name")}
          className="menu-panel absolute inset-x-0 top-full z-10 flex flex-col gap-1 border-b border-line bg-paper p-4 shadow-sm md:hidden"
        >
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              className={`rounded-lg px-3 py-2.5 ${navLinkClass(pathname === link.href)}`}
            >
              {t(link.key)}
            </a>
          ))}
          <div className="mt-2 flex flex-col gap-2 border-t border-line pt-3">
            <a
              href="https://kinlock-org.github.io"
              className="rounded-full border border-line px-4 py-2 text-center text-sm font-medium text-ink"
            >
              {t("nav.docs")}
            </a>
            <a
              href="https://github.com/Kinlock-Org"
              className="rounded-full bg-ink/5 px-4 py-2 text-center text-sm font-medium text-ink"
            >
              {t("nav.github")}
            </a>
          </div>
        </nav>
      ) : null}
    </>
  );
}
