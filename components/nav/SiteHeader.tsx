import { t } from "@/lib/i18n/messages";
import { DesktopNavLinks, MobileMenu } from "./NavLinks";

/**
 * Persistent site header: brand, primary nav, and two separately-styled, separately-destined
 * buttons for the docs site and the GitHub repos (roadmap: docs/site-polish).
 *
 * Converted to a Server Component to cut first-load JavaScript (roadmap M3-18, Issue #41).
 * Layout, brand SVG, and external links render entirely on the server; dynamic active links
 * and the mobile disclosure menu are isolated in the `NavLinks` client island.
 */
export function SiteHeader() {
  return (
    <header className="relative border-b border-line">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <a href="/" className="flex items-center gap-2 font-semibold tracking-tight">
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
          <DesktopNavLinks />
          <span className="h-4 w-px bg-line" aria-hidden="true" />
          <a
            href="https://kinlock-org.github.io"
            className="rounded-full border border-line px-4 py-1.5 text-sm font-medium text-ink transition-colors motion-reduce:transition-none hover:border-accent hover:text-accent"
          >
            {t("nav.docs")}
          </a>
          <a
            href="https://github.com/Kinlock-Org"
            className="rounded-full bg-ink/5 px-4 py-1.5 text-sm font-medium text-ink transition-colors motion-reduce:transition-none hover:bg-ink/10"
          >
            {t("nav.github")}
          </a>
        </nav>

        <MobileMenu />
      </div>
    </header>
  );
}
