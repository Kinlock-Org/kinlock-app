import { t } from "@/lib/i18n/messages";

interface SkipLinkProps {
  targetId?: string;
}

/**
 * Accessible skip-to-content navigation link (AGENTS.md §8.3, Roadmap M3-17 / #39).
 * Visually hidden until focused via keyboard Tab navigation. Placed as the first
 * focusable element in the page layout so keyboard and screen-reader users can
 * immediately jump past global banners and persistent header navigation to main content.
 */
export function SkipLink({ targetId = "main-content" }: SkipLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:border focus:border-line focus:bg-paper focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-ink focus:shadow-md focus:outline-2 focus:outline-offset-2 focus:outline-accent"
    >
      {t("common.skipToContent")}
    </a>
  );
}
