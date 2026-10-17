import { Spinner } from "@/components/ui/Spinner";
import { StatePanel } from "@/components/ui/StatePanel";
import { t } from "@/lib/i18n/messages";

export default function Loading() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <StatePanel
        role="status"
        icon={<Spinner label={t("states.loading.title")} className="size-8 text-forest" />}
        title={t("states.loading.title")}
        description={t("states.loading.generic")}
      />
    </main>
  );
}
