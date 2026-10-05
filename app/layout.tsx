import type { ReactNode } from "react";
import { t } from "@/lib/i18n/messages";
import "./globals.css";

export const metadata = { title: t("app.name") };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
