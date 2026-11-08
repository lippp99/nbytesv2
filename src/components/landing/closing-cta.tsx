import Image from "next/image";
import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";
import { primaryButton, secondaryButton, textLink } from "@/components/button-styles";
import { ProviderLogo } from "@/components/provider-logo";
import { cn } from "@/lib/utils";
import nbMark from "../../../public/brand/nb-orange.png";
import { actions, closing, footer } from "./landing-copy";
import { Hl, frame, sectionPad } from "./section";

// Two stairs of marks on a 36px grid, as on jatevo.ai's closing call (measured via Pencil: left stair from the top,
// right stair to the bottom, one brand tile in each). Ours are overlapping coins instead of square tiles.
type Coin = { icon: string | null; c: number; r: number; d: string };
const left: Coin[] = [
  { icon: "openai", c: 2, r: 0, d: "-1s" },
  { icon: "kimi", c: 0, r: 1, d: "-2.2s" },
  { icon: null, c: 1, r: 2, d: "-3.4s" },
  { icon: "codex", c: 2, r: 3, d: "-4.6s" },
  { icon: "qwen", c: 3, r: 4, d: "-5.2s" },
];
const right: Coin[] = [
  { icon: "chatglm", c: 3, r: 4, d: "-0.6s" },
  { icon: "claude", c: 2, r: 3, d: "-1.8s" },
  { icon: "opencode", c: 1, r: 2, d: "-3s" },
  { icon: null, c: 0, r: 1, d: "-4.2s" },
  { icon: "gemini", c: 2, r: 0, d: "-5.4s" },
];

// Owner's NB monogram (public/brand/nb-orange.png, 1024x1024, artwork centred), shown as is, no badge around it.
function BrandMark({ className }: { className?: string }) {
  return <Image src={nbMark} alt="" sizes="64px" className={cn("object-contain", className)} />;
}

function CoinView({ coin, side }: { coin: Coin; side: "left" | "right" }) {
  const x = `calc(var(--side) + ${coin.c * 36}px)`;
  const y = `${40 + coin.r * 36}px`;
  const place = side === "left" ? { left: x, top: y } : { right: x, bottom: y };
  return (
    <li className="absolute animate-bob" style={{ ...place, animationDelay: coin.d }}>
      <span className="grid size-10 place-items-center rounded-full border border-foreground/10 bg-background shadow-coin ring-4 ring-background">
        {coin.icon ? <ProviderLogo icon={coin.icon} className="size-4.5" /> : <BrandMark className="size-6" />}
      </span>
    </li>
  );
}

export function ClosingCta() {
  return (
    <section aria-labelledby="penutup-judul" className="relative overflow-hidden border-t border-dashed border-guide">
      <ul aria-hidden className="cta-floats pointer-events-none absolute inset-0 hidden lg:block">
        {left.map((coin, i) => <CoinView key={`l${i}`} coin={coin} side="left" />)}
        {right.map((coin, i) => <CoinView key={`r${i}`} coin={coin} side="right" />)}
      </ul>
      <div className={cn(frame, sectionPad)}>
        <div data-reveal className="relative mx-auto flex max-w-2xl flex-col items-center text-center">
          <BrandMark className="mb-4 size-16" />
          <h2 id="penutup-judul" className="text-h2 text-balance">
            {closing.titleBefore} <Hl>{closing.titleMark}</Hl>
          </h2>
          <p className="mt-3 max-w-prose text-lead text-muted-foreground text-pretty">{closing.lead}</p>
          <div className="mt-7 flex flex-wrap justify-center gap-x-4.5 gap-y-3.5">
            <Link href="/login" className={primaryButton()}>
              {actions.getKey}
              <ChevronRightIcon aria-hidden />
            </Link>
            <a href="#model" className={secondaryButton()}>
              {actions.seeModels}
              <ChevronRightIcon aria-hidden />
            </a>
          </div>
          <p className="mt-5 text-ui text-muted-foreground">
            {closing.ask}{" "}
            <a href={`mailto:${footer.contact}`} className={`${textLink} text-foreground`}>{closing.askLink}</a>.
          </p>
        </div>
      </div>
    </section>
  );
}
