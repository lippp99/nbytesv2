import { useEffect, useRef, useState } from "react";
import type { CatalogModel } from "@/lib/gateway/catalog-contract";
import { DEFAULT_OUTPUT_TOKENS, chargeMicros } from "@/lib/gateway/price-math";
import { type PlaygroundError, streamChat } from "@/lib/playground/playground-client";
import { type RequestMessage, buildMessages, requestBody } from "./playground-request";

export type Settings = { modelId: string; system: string; temperature: number; maxTokens: number };
export type Usage = { input: number; output: number; costMicros: number };
/** streaming: text still arriving; done; stopped by the user; cut: the stream broke off after some text. */
export type TurnStatus = "streaming" | "done" | "stopped" | "cut";
export type Turn = { id: number; role: "user" | "assistant"; content: string; modelId?: string; usage?: Usage; status?: TurnStatus };

const MIN_TOKENS = 64;
const START_TOKENS = 1024;
/** Upper end of the max tokens slider: the model's own maximum, or the gateway default when the catalog does not know. */
export const maxOutputOf = (model: CatalogModel | undefined) => model?.maxCompletionTokens ?? DEFAULT_OUTPUT_TOKENS;
const clampTokens = (value: number, model: CatalogModel | undefined) => Math.max(MIN_TOKENS, Math.min(value, maxOutputOf(model)));
const toHistory = (turns: Turn[]): RequestMessage[] => turns.map(({ role, content }) => ({ role, content }));

/** Conversation state of the Playground: real streamed answers, real token counts, cost at the catalog's sell price. */
export function usePlayground(models: CatalogModel[]) {
  const [settings, setSettings] = useState<Settings>(() => ({
    modelId: models[0]?.id ?? "", system: "", temperature: 0.7, maxTokens: clampTokens(START_TOKENS, models[0]),
  }));
  const [turns, setTurns] = useState<Turn[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<PlaygroundError | null>(null);
  const abort = useRef<AbortController | null>(null);
  const nextId = useRef(1);
  const model = models.find((m) => m.id === settings.modelId);

  useEffect(() => () => abort.current?.abort(), []);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((s) => {
      const next = { ...s, [key]: value };
      // A smaller model maximum pulls the slider down with it.
      return key === "modelId" ? { ...next, maxTokens: clampTokens(next.maxTokens, models.find((m) => m.id === value)) } : next;
    });
  }

  const patch = (id: number, change: (t: Turn) => Partial<Turn>) =>
    setTurns((all) => all.map((t) => (t.id === id ? { ...t, ...change(t) } : t)));

  /** Sends one message; returns the text back when nothing was answered, so the composer can keep it. */
  async function send(text: string): Promise<string | null> {
    if (!text.trim() || pending || !model) return null;
    const user: Turn = { id: nextId.current++, role: "user", content: text.trim() };
    const reply: Turn = { id: nextId.current++, role: "assistant", content: "", modelId: model.id, status: "streaming" };
    const body = requestBody(
      { model: model.id, temperature: settings.temperature, maxTokens: settings.maxTokens },
      buildMessages(settings.system, toHistory([...turns, user])),
    );
    setTurns((t) => [...t, user, reply]);
    setPending(true);
    setError(null);
    abort.current = new AbortController();
    let answered = false;
    const result = await streamChat(body, abort.current.signal, (delta) => {
      answered = true;
      patch(reply.id, (t) => ({ content: t.content + delta }));
    });
    abort.current = null;
    setPending(false);
    if (result.ok) {
      const usage = result.usage && { ...result.usage, costMicros: chargeMicros(result.usage.input, result.usage.output, model) };
      patch(reply.id, () => ({ status: result.stopped ? "stopped" : "done", usage: usage ?? undefined }));
      return null;
    }
    setError(result.error);
    if (answered) {
      patch(reply.id, () => ({ status: "cut" }));
      return null;
    }
    // Nothing came back: drop both turns, the message goes back into the composer.
    setTurns((all) => all.filter((t) => t.id !== user.id && t.id !== reply.id));
    return user.content;
  }

  function stop() {
    abort.current?.abort();
  }

  function clear() {
    stop();
    setTurns([]);
    setError(null);
  }

  const totals = turns.reduce(
    (sum, t) => (t.usage ? { tokens: sum.tokens + t.usage.input + t.usage.output, costMicros: sum.costMicros + t.usage.costMicros } : sum),
    { tokens: 0, costMicros: 0 },
  );
  const history = buildMessages(settings.system, toHistory(turns.filter((t) => t.content)));

  return { settings, update, model, turns, history, pending, error, send, stop, clear, totals };
}
