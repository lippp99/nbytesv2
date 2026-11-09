import { RevealObserver } from "@/components/reveal-observer";
import { ClosingCta } from "@/components/landing/closing-cta";
import { FaqSection } from "@/components/landing/faq-section";
import { FeaturesSection } from "@/components/landing/features/features-section";
import { Hero } from "@/components/landing/hero/hero";
import { AgentsSection } from "@/components/landing/agents/agents-section";
import { footer } from "@/components/landing/shared/landing-copy";
import { ModelSection } from "@/components/landing/models/model-section";
import { PrivacySection } from "@/components/landing/privacy-section";
import { SiteFooter } from "@/components/landing/shell/site-footer";
import { SiteHeader } from "@/components/landing/shell/site-header";

const skipLink =
  "sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-background focus:px-4 focus:py-2 focus:outline-2 focus:outline-ring";

export default function Home() {
  return (
    <>
      <a
        href="#konten"
        className={skipLink}
      >
        {footer.skip}
      </a>
      <SiteHeader />
      <main id="konten" className="flex-1">
        <Hero />
        <ModelSection />
        <AgentsSection />
        <FeaturesSection />
        <PrivacySection />
        <FaqSection />
        <ClosingCta />
      </main>
      <SiteFooter />
      <RevealObserver />
    </>
  );
}
