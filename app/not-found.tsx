import Link from "next/link";
import { StatePanel } from "@/components/ui/StatePanel";
import { t } from "@/lib/i18n/messages";

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <StatePanel
        role="region"
        title={t("states.notFound.title")}
        description={t("states.notFound.description")}
        action={
          <Link
            href="/"
            className="rounded-lg bg-forest px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-forest/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
          >
            {t("states.notFound.home")}
          </Link>
        }
      />
    </main>
  );
}
