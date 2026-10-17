"use client";

import { useEffect, useRef } from "react";
import { StatePanel } from "@/components/ui/StatePanel";
import { t } from "@/lib/i18n/messages";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ reset }: ErrorProps) {
  const retryRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Focus lands on the retry control for keyboard and screen-reader accessibility
    retryRef.current?.focus();
  }, []);

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <StatePanel
        role="alert"
        title={t("states.error.title")}
        description={t("states.error.description")}
        action={
          <button
            ref={retryRef}
            type="button"
            onClick={reset}
            className="rounded-lg bg-forest px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-forest/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
          >
            {t("states.error.retry")}
          </button>
        }
      />
    </main>
  );
}
