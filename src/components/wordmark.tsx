import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import logoOnDark from "../../public/brand/nbytes-dark.png";
import logoOnLight from "../../public/brand/nbytes-light.png";

// Owner's logo files: "-light" has dark lettering for the light theme, "-dark" has light lettering for the dark theme.
// Both are 2048x512 with transparent margins; .brand-logo crops them to the lettering box (see globals.css).
export function Wordmark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="nbytes, ke beranda"
      className={cn(
        "inline-flex h-11 shrink-0 items-center rounded-sm",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className,
      )}
    >
      <span className="brand-logo h-5.5">
        <Image src={logoOnLight} alt="nbytes" loading="eager" sizes="96px" className="dark:hidden" />
        <Image src={logoOnDark} alt="nbytes" loading="eager" sizes="96px" className="hidden dark:block" />
      </span>
    </Link>
  );
}
