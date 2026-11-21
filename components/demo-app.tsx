"use client";

import { I18nProvider, useI18n } from "@/lib/i18n/context";
import { LOCALES, MESSAGES } from "@/lib/i18n/messages";
import { ScannerBoard } from "./scanner-board";

function LanguageSwitcher() {
  const { locale, setLocale, m } = useI18n();
  return (
    <div className="flex items-center gap-1" role="group" aria-label={m.langSwitch}>
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={locale === l}
          data-testid={`lang-${l}`}
          onClick={() => setLocale(l)}
          className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
            locale === l
              ? "border-accent-tech bg-accent-tech/[0.08] text-foreground"
              : "border-foreground/15 text-foreground/60 hover:border-accent-tech/50 hover:text-foreground"
          }`}
        >
          {MESSAGES[l].langName}
        </button>
      ))}
    </div>
  );
}

function Shell() {
  const { m, locale } = useI18n();
  return (
    // min-w-0: the wide table scrolls inside its own box instead of widening the page
    <div lang={locale} className="flex min-w-0 flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 pt-6 sm:px-12 sm:pt-8">
        <span className="text-sm font-medium tracking-[0.2em] text-foreground">{m.header.brand}</span>
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-[11px] tracking-widest text-foreground/50 uppercase">{m.header.tagline}</span>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="px-4 pt-12 pb-24 sm:px-12 sm:pt-16 sm:pb-32">
        <div className="mx-auto flex w-full max-w-6xl min-w-0 flex-col">
          <section className="flex flex-col items-start">
            <span className="mb-3 font-mono text-[11px] tracking-[0.25em] text-foreground/55 uppercase">
              {m.hero.kicker}
            </span>
            <h1 className="text-4xl leading-[1.05] font-medium tracking-tight text-foreground sm:text-6xl sm:leading-[1.0]">
              {m.hero.title}
            </h1>
            <p className="mt-3 text-lg text-foreground/60">{m.hero.subtitle}</p>
          </section>

          <ScannerBoard />

          <p className="mt-12 max-w-3xl text-xs leading-relaxed text-foreground/50">{m.disclaimer}</p>
        </div>
      </main>
    </div>
  );
}

export function DemoApp() {
  return (
    <I18nProvider>
      <Shell />
    </I18nProvider>
  );
}
