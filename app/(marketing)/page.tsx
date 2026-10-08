/** Landing and plain-language explainer. Roadmap M3-04. */
import { t } from "@/lib/i18n/messages";
import { FlowDiagram } from "./FlowDiagram";

export default function Page() {
  return (
    <main>
      <Hero />
      <HowItWorks />
      <Audiences />
      <Principles />
      <Footer />
    </main>
  );
}

function Hero() {
  return (
    <section className="mx-auto max-w-5xl px-4 pt-16 pb-12 md:pt-20">
      <div className="grid gap-10 md:grid-cols-2 md:items-center md:gap-16">
        <div>
          <h1 className="text-4xl leading-tight font-semibold tracking-tight md:text-5xl">
            {t("pages.home.heroHeadline")}
          </h1>
          <p className="mt-4 max-w-[36ch] text-lg text-ink/70">{t("pages.home.heroSubtext")}</p>
          <a
            href="/send"
            className="mt-8 inline-flex items-center rounded-full bg-accent px-6 py-3 font-medium text-accent-ink transition-transform active:scale-[0.98]"
          >
            {t("pages.home.heroCta")}
          </a>
        </div>
        <FlowDiagram />
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps: { title: string; body: string }[] = [
    { title: t("pages.home.lockTitle"), body: t("pages.home.lockBody") },
    { title: t("pages.home.claimTitle"), body: t("pages.home.claimBody") },
    { title: t("pages.home.verifyTitle"), body: t("pages.home.verifyBody") },
  ];
  return (
    <section className="mx-auto max-w-5xl px-4 py-16">
      <h2 className="text-2xl font-semibold tracking-tight">{t("pages.home.howItWorksHeading")}</h2>
      <ol className="mt-8 grid gap-8 md:grid-cols-3 md:gap-6">
        {steps.map((step, i) => (
          <li key={step.title} className="border-t border-line pt-4">
            <span className="text-sm text-ink/50">{i + 1}</span>
            <h3 className="mt-1 text-lg font-medium">{step.title}</h3>
            <p className="mt-2 text-ink/70">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Audiences() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-16">
      <div className="grid gap-10 md:grid-cols-2 md:gap-16">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("pages.home.sendersHeading")}
          </h2>
          <p className="mt-3 text-ink/70">{t("pages.home.sendersBody")}</p>
          <a
            href="/send"
            className="mt-4 inline-block font-medium text-accent underline underline-offset-4"
          >
            {t("pages.home.sendersCta")}
          </a>
        </div>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{t("pages.home.payeesHeading")}</h2>
          <p className="mt-3 text-ink/70">{t("pages.home.payeesBody")}</p>
          <a
            href="/request"
            className="mt-4 inline-block font-medium text-accent underline underline-offset-4"
          >
            {t("pages.home.payeesCta")}
          </a>
        </div>
      </div>
    </section>
  );
}

function Principles() {
  const items: { title: string; body: string }[] = [
    { title: t("pages.home.nonCustodialTitle"), body: t("pages.home.nonCustodialBody") },
    { title: t("pages.home.chainTruthTitle"), body: t("pages.home.chainTruthBody") },
    { title: t("pages.home.honestReceiptsTitle"), body: t("pages.home.honestReceiptsBody") },
    { title: t("pages.home.worldwideTitle"), body: t("pages.home.worldwideBody") },
  ];
  return (
    <section className="mx-auto max-w-5xl px-4 py-16">
      <h2 className="text-2xl font-semibold tracking-tight">{t("pages.home.principlesHeading")}</h2>
      <dl className="mt-8 grid gap-8 md:grid-cols-2 md:gap-x-16 md:gap-y-10">
        {items.map((item) => (
          <div key={item.title}>
            <dt className="text-lg font-medium">{item.title}</dt>
            <dd className="mt-2 text-ink/70">{item.body}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function Footer() {
  return (
    <footer className="mx-auto max-w-5xl px-4 py-12">
      <div className="flex flex-col gap-4 border-t border-line pt-8 text-sm text-ink/60 md:flex-row md:items-center md:justify-between">
        <p className="max-w-[48ch]">{t("pages.home.footerDisclaimer")}</p>
        <nav className="flex gap-6">
          <a href="https://github.com/Kinlock-Org" className="underline underline-offset-4">
            {t("pages.home.footerSource")}
          </a>
          <a
            href="https://github.com/Kinlock-Org/.github/blob/main/docs/ARCHITECTURE_ESSENTIALS.md"
            className="underline underline-offset-4"
          >
            {t("pages.home.footerDocs")}
          </a>
        </nav>
      </div>
    </footer>
  );
}
