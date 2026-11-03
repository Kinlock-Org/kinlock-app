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
  `rounded-md text-sm font-medium transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
    active ? "text-accent" : "text-ink/70 hover:text-accent"
  }`;

/**
 * Persistent site header: brand, primary nav, and two separately-styled, separately-destined
 * buttons for the docs site and the GitHub repos (roadmap: docs/site-polish). Collapses to a
 * disclosure menu below `md`. A client leaf per the animate skill's RSC isolation rule; the rest
 * of the tree (layout, pages) stays server-rendered.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

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
    <header className="relative border-b border-line">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <a
          href="/"
          className="flex items-center gap-2 rounded-md font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <svg viewBox="0 0 1024 1024" className="h-6 w-6 fill-accent" aria-hidden="true">
            <mask id="header-lock-mask">
              <rect width="1024" height="1024" fill="white" />
              <rect x="452" y="570" width="120" height="120" rx="18" fill="black" />
            </mask>
            <g mask="url(#header-lock-mask)">
              <rect x="184" y="420" width="656" height="420" rx="72" />
              <path
                d="M332 430V330A180 180 0 0 1 692 330V430"
                fill="none"
                stroke="currentColor"
                strokeWidth="96"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          </svg>
          {t("app.name")}
        </a>

        <nav className="hidden items-center gap-6 md:flex" aria-label={t("app.name")}>
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
          <span className="h-4 w-px bg-line" aria-hidden="true" />
          <a
            href="https://kinlock-org.github.io"
            className="rounded-full border border-line px-4 py-1.5 text-sm font-medium text-ink transition-colors motion-reduce:transition-none hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {t("nav.docs")}
          </a>
          <a
            href="https://github.com/Kinlock-Org"
            className="rounded-full bg-ink/5 px-4 py-1.5 text-sm font-medium text-ink transition-colors motion-reduce:transition-none hover:bg-ink/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {t("nav.github")}
          </a>
        </nav>

        <button
          ref={toggleRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={menuId}
          aria-label={open ? t("nav.closeMenu") : t("nav.openMenu")}
          className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:hidden"
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
      </div>

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
              className="rounded-full border border-line px-4 py-2 text-center text-sm font-medium text-ink transition-colors motion-reduce:transition-none hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {t("nav.docs")}
            </a>
            <a
              href="https://github.com/Kinlock-Org"
              className="rounded-full bg-ink/5 px-4 py-2 text-center text-sm font-medium text-ink transition-colors motion-reduce:transition-none hover:bg-ink/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {t("nav.github")}
            </a>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
