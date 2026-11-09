import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons/ui/arrow-right";
import { focusRing, primaryButton } from "@/components/button-styles";
import { ProviderLogo } from "@/components/provider-logo";
import { DashboardMock } from "./dashboard-mock/dashboard-mock";
import { actions, hero } from "../shared/landing-copy";
import { ModelStrip } from "./model-strip";
import { PriceChart } from "./price-chart/price-chart";
import { RotatingHighlight } from "./rotating-highlight";
import { frame, stagger } from "../shared/section";

const pillLogos = ["openai", "claude", "gemini"];
const textAction = `group inline-flex h-9.5 items-center gap-1.5 px-1.5 text-ui font-medium lg:text-sm text-foreground/80 hover:text-foreground ${focusRing}`;

export function Hero() {
  const words = hero.titleLine1.split(" ");
  return (
    <section aria-labelledby="hero-judul">
      <div className={`${frame} grid grid-cols-1 items-center gap-11 pt-14 pb-18 lg:grid-cols-2 lg:gap-14 lg:pt-24 lg:pb-26`}>
        <div>
          <a
            href="#model"
            className="group inline-flex animate-enter-up items-center gap-2 text-ui text-muted-foreground hover:text-foreground lg:text-sm"
            style={stagger(0)}
          >
            <span className="flex">
              {pillLogos.map((icon) => (
                <span key={icon} className="-ml-px grid size-5 place-items-center border border-border bg-background first:ml-0">
                  <ProviderLogo icon={icon} className="size-3.5" />
                </span>
              ))}
            </span>
            <span className="underline-offset-4 group-hover:underline">{hero.pill}</span>
            <ArrowRightIcon className="size-3 transition-transform duration-150 group-hover:translate-x-0.5" />
          </a>
          <h1 id="hero-judul" className="mt-5 text-display">
            <span className="sr-only">{`${hero.titleLine1} ${hero.rotating[0]}.`}</span>
            <span aria-hidden>
              {words.map((word, i) => (
                <span key={word} className="inline-block animate-word-in" style={stagger(i + 1)}>
                  {word}
                  {i < words.length - 1 && " "}
                </span>
              ))}
              <br />
              <span className="inline-block animate-word-in" style={stagger(words.length + 1)}>
                <RotatingHighlight words={hero.rotating} />.
              </span>
            </span>
          </h1>
          <p className="mt-5 max-w-120 animate-enter-up text-lead text-muted-foreground text-pretty lg:text-lg" style={stagger(6)}>
            {hero.lead}
          </p>
          <div className="mt-7 flex animate-enter-up flex-wrap items-center gap-x-4.5 gap-y-3.5" style={stagger(7)}>
            <Link href="/login" className={primaryButton()}>
              {actions.getKey}
              <ArrowRightIcon />
            </Link>
            <a href="#model" className={textAction}>
              {actions.seeModels}
              <ArrowRightIcon className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>
        <div className="min-w-0">
          <PriceChart />
        </div>
      </div>
      <ModelStrip />
      <DashboardMock />
    </section>
  );
}
