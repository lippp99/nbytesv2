import type { HighlighterCore } from "shiki/core";

// VS Code-style colours for the dashboard's code blocks: Shiki with VS Code's default themes (Light+ / Dark+), only the
// languages the dashboard shows, and the JavaScript regex engine (no WebAssembly download). Loaded on first use.

export type CodeLang = "bash" | "python" | "ts" | "json";
/** One coloured piece of a line; `light`/`dark` are null where the token has the theme's plain text colour. */
export type CodeToken = { content: string; light: string | null; dark: string | null };

const grammar: Record<CodeLang, string> = { bash: "shellscript", python: "python", ts: "typescript", json: "json" };
const themes = { light: "light-plus", dark: "dark-plus" } as const;
// Light+ colours under 4.5:1 on app-inset, swapped for the same hue darker (measured 2026-11-12: 4.15 -> 4.99,
// 4.22 -> 4.93, 4.21 -> 4.96). Dark+ passes everywhere (lowest 5.43 on app-surface).
const lighterThanAllowed: Record<string, string> = { "#ee0000": "#d60000", "#098658": "#077a50", "#267f99": "#227389" };

let loading: Promise<HighlighterCore> | null = null;

function highlighter(): Promise<HighlighterCore> {
  loading ??= Promise.all([import("shiki/core"), import("shiki/engine/javascript")]).then(([core, engine]) =>
    core.createHighlighterCore({
      themes: [import("shiki/themes/light-plus.mjs"), import("shiki/themes/dark-plus.mjs")],
      langs: [
        import("shiki/langs/shellscript.mjs"), import("shiki/langs/python.mjs"),
        import("shiki/langs/typescript.mjs"), import("shiki/langs/json.mjs"),
      ],
      engine: engine.createJavaScriptRegexEngine(),
    }),
  );
  return loading;
}

/** The code split into lines of tokens. The theme's own text colour is dropped so plain text keeps `app-text`. */
export async function highlightCode(code: string, lang: CodeLang): Promise<CodeToken[][]> {
  const h = await highlighter();
  const fg = { light: h.getTheme(themes.light).fg.toLowerCase(), dark: h.getTheme(themes.dark).fg.toLowerCase() };
  const { tokens } = h.codeToTokens(code, { lang: grammar[lang], themes, defaultColor: false });
  return tokens.map((line) =>
    line.map((t) => {
      const light = String(t.htmlStyle?.["--shiki-light"] ?? "").toLowerCase();
      const dark = String(t.htmlStyle?.["--shiki-dark"] ?? "").toLowerCase();
      return {
        content: t.content,
        light: light && light !== fg.light ? (lighterThanAllowed[light] ?? light) : null,
        dark: dark && dark !== fg.dark ? dark : null,
      };
    }),
  );
}
