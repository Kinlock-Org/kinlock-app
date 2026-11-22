import { Outfit } from "next/font/google";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/nav/SiteHeader";
import { t } from "@/lib/i18n/messages";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", display: "swap" });

/**
 * [sec] Every page is rendered per request. proxy.ts sends a nonce-based CSP on every route, and a
 * prerendered (static) page can't carry that request's nonce, so the browser would block all of
 * its scripts and the page would never hydrate.
 */
export const dynamic = "force-dynamic";

export const metadata = {
  title: t("app.name"),
  description: t("app.tagline"),
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={outfit.variable} style={{ colorScheme: "light dark" }}>
      <body className="bg-paper text-ink antialiased font-sans">
        <div className="bg-ink px-4 py-2 text-center text-sm text-paper">
          {t("common.testnetBanner")}
        </div>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
