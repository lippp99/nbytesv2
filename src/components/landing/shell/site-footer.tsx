import { focusRing, textLink } from "@/components/button-styles";
import { Wordmark } from "@/components/wordmark";
import { FooterWordmark } from "./footer-wordmark";
import { footer } from "../shared/landing-copy";
import { frame } from "../shared/section";

const bottomRow =
  "flex flex-col gap-4 border-t border-dashed border-guide pt-6 text-sm text-muted-foreground " +
  "sm:col-span-12 sm:flex-row sm:items-center sm:justify-between";

const footerLink =
  `inline-flex min-h-11 items-center text-sm text-muted-foreground transition-colors hover:text-foreground sm:min-h-9 ${focusRing}`;

async function CopyrightYear() {
  "use cache";
  return <>{new Date().getFullYear()}</>;
}

export function SiteFooter() {
  return (
    <footer className="border-t border-dashed border-guide">
      <div className={`${frame} grid gap-10 pt-12 sm:grid-cols-12 sm:gap-6 lg:pt-16`}>
        <div className="sm:col-span-12 lg:col-span-6">
          <Wordmark />
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">{footer.tagline}</p>
        </div>
        {footer.groups.map((group) => (
          <nav key={group.title} aria-label={group.title} className="sm:col-span-4 lg:col-span-2">
            <h2 className="text-sm font-medium">{group.title}</h2>
            <ul className="mt-3 space-y-1">
              {group.links.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className={footerLink}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
        <div className={bottomRow}>
          <p>
            © <CopyrightYear /> nbytes ·{" "}
            <a href={`mailto:${footer.contact}`} className={textLink}>{footer.contact}</a>
          </p>
        </div>
        {/* sits flush on the page bottom; 48px above on phones growing to 104px, like experientiallabs.ai */}
        <div className="mt-2 sm:col-span-12 sm:mt-6 lg:mt-20">
          <FooterWordmark />
        </div>
      </div>
    </footer>
  );
}
