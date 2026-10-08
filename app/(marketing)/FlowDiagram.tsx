/**
 * Shows the real mechanism, not decoration: funds move sender -> lock -> payee, or back to
 * the sender if unclaimed. No third path exists (ARCHITECTURE_ESSENTIALS.md invariant 3).
 */
export function FlowDiagram() {
  return (
    <div aria-hidden="true" className="flex items-center justify-center gap-2 md:gap-3">
      <Node label="Sender" />
      <Arrow />
      <Node label="Locked USDC" emphasis />
      <Arrow />
      <Node label="Payee" />
    </div>
  );
}

function Node({ label, emphasis }: { label: string; emphasis?: boolean }) {
  return (
    <div
      className={
        emphasis
          ? "rounded-2xl border border-accent bg-accent/10 px-4 py-5 text-center text-sm font-medium"
          : "rounded-2xl border border-line px-4 py-5 text-center text-sm font-medium text-ink/70"
      }
    >
      {label}
    </div>
  );
}

function Arrow() {
  return <div className="h-px w-4 flex-none bg-line md:w-6" />;
}
