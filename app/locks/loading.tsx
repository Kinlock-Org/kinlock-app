import { Spinner } from "@/components/ui/Spinner";
import { StatePanel } from "@/components/ui/StatePanel";
import { t } from "@/lib/i18n/messages";

export default function LocksLoading() {
  return (
    <main className="mx-auto max-w-xl p-4 py-12">
      <StatePanel
        role="status"
        icon={<Spinner label={t("states.loading.title")} className="size-8 text-forest" />}
        title={t("states.loading.title")}
        description={t("states.loading.locks")}
      />
    </main>
  );
}
