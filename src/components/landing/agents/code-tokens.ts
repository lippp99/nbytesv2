// Small per-language highlighters for the setup snippets (the same token classes jatevo.ai uses: key, string,
// number, function). shortcut: regex-based, enough for these short configs; use a real highlighter for docs pages.
export type Tone = "" | "key" | "str" | "num" | "fn";
export type Token = [Tone, string];
export type Lang = "json" | "yaml" | "toml" | "sh";

const RE: Record<Lang, RegExp> = {
  json: /("(?:[^"\\]|\\.)*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?)|([\s\S])/g,
  toml: /^(\s*\[[^\]]+\])|^(\s*[\w.-]+)(?=\s*=)|("(?:[^"\\]|\\.)*")|\b(true|false|\d+)\b|([\s\S])/g,
  yaml: /^(\s*(?:- )?)([\w.-]+)(?=:)|(:\s*)(.+)$|([\s\S])/g,
  sh: /^(export)\b|(\s-{1,2}[A-Za-z][\w-]*)|\b([A-Z_]+=)(\S*)|^(\w+)|([\s\S])/g,
};

function toTokens(m: RegExpExecArray, lang: Lang): Token[] {
  if (lang === "json") {
    if (m[1]) return m[2] ? [["key", m[1]], ["", m[2]]] : [["str", m[1]]];
    return [[m[3] ? "key" : m[4] ? "num" : "", m[0]]];
  }
  if (lang === "toml") return [[m[1] ? "fn" : m[2] ? "key" : m[3] ? "str" : m[4] ? "num" : "", m[0]]];
  if (lang === "yaml") {
    if (m[2]) return [["", m[1]], ["key", m[2]]];
    if (m[4]) return [["", m[3]], ["str", m[4]]];
    return [["", m[0]]];
  }
  if (m[3]) return [["", m[3]], ["str", m[4]]];
  return [[m[1] || m[2] ? "key" : m[5] ? "fn" : "", m[0]]];
}

/** Splits one line into coloured tokens; joining the token texts gives back the line unchanged. */
export function tokenize(line: string, lang: Lang): Token[] {
  const re = RE[lang];
  const out: Token[] = [];
  let m: RegExpExecArray | null;
  re.lastIndex = 0;
  while ((m = re.exec(line))) out.push(...toTokens(m, lang));
  return out;
}
