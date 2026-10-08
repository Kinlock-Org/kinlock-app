import { Outfit } from "next/font/google";
import type { ReactNode } from "react";
import { t } from "@/lib/i18n/messages";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", display: "swap" });

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
        {children}
      </body>
    </html>
  );
}
