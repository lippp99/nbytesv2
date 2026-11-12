import type { Metadata } from "next";
import { Fragment_Mono, Funnel_Display, Funnel_Sans, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { sidebarBootScript } from "@/lib/sidebar-state";
import "./globals.css";

const funnelDisplay = Funnel_Display({
  variable: "--font-funnel-display",
  subsets: ["latin", "latin-ext"],
});

const funnelSans = Funnel_Sans({
  variable: "--font-funnel-sans",
  subsets: ["latin", "latin-ext"],
});

// Fragment Mono (PRD §3.2 fallback mono): 0.618em advance, close to the 0.6em mono jatevo.ai uses for code.
// Martian Mono (0.75em) made code and ids read ~25% wider; measured from both font files on 2026-11-08.
const fragmentMono = Fragment_Mono({
  variable: "--font-fragment-mono",
  weight: "400",
  subsets: ["latin", "latin-ext"],
});

// Dashboard and admin code face (dashboard-design §1, owner 2026-11-12). Not preloaded: the landing never uses it, and
// its @font-face only downloads where a dashboard page draws mono text (globals.css sets --font-code under [data-app]).
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin", "latin-ext"],
  preload: false,
});

// Working name "nbytes" until the owner decides the product name (PRD §12).
export const metadata: Metadata = {
  title: { default: "nbytes · Satu API key untuk semua model AI", template: "%s · nbytes" },
  description: "AI gateway yang kompatibel dengan OpenAI: satu key, banyak provider, log dan biaya per request.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      data-scroll-behavior="smooth"
      className={`${funnelDisplay.variable} ${funnelSans.variable} ${fragmentMono.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        {/* Restores a folded dashboard/admin sidebar before first paint. In the root layout because a <script> in a
            nested layout is created on the client after router.push (login -> dashboard) and never runs. */}
        <script dangerouslySetInnerHTML={{ __html: sidebarBootScript }} />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
