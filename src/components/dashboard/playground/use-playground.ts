import { useEffect, useRef, useState } from "react";
import { modelById, mockModels } from "@/lib/model-catalog";
import { playground as copy } from "./playground-copy";
import { callCostMicros, estimateTokens } from "./playground-cost";
import { type RequestMessage, buildMessages } from "./playground-request";

export type Settings = { modelId: string; system: string; temperature: number; maxTokens: number };
export type Usage = { input: number; output: number; costMicros: number };
export type Turn = { id: number; role: "user" | "assistant"; content: string; modelId?: string; usage?: Usage };

const REPLY_DELAY_MS = 900;
const PROMPT_PREVIEW = 60;
export const defaultSettings: Settings = { modelId: mockModels[0].id, system: "", temperature: 0.7, maxTokens: 1024 };

const toHistory = (turns: Turn[]): RequestMessage[] => turns.map(({ role, content }) => ({ role, content }));

/** Conversation state for the playground. Demo: replies are canned, token counts estimated, prices real. */
export function usePlayground() {
  const [settings, setSettings] = useState(defaultSettings);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [pending, setPending] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextId = useRef(1);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((s) => ({ ...s, [key]: value }));
  }

  function send(text: string) {
    const model = modelById(settings.modelId);
    if (!text.trim() || pending || !model) return;
    const userTurn: Turn = { id: nextId.current++, role: "user", content: text.trim() };
    const sent = buildMessages(settings.system, toHistory([...turns, userTurn]));
    setTurns((t) => [...t, userTurn]);
    setPending(true);
    timer.current = setTimeout(() => {
      const preview = userTurn.content.length > PROMPT_PREVIEW ? `${userTurn.content.slice(0, PROMPT_PREVIEW)}…` : userTurn.content;
      const content = copy.reply(preview, model.name);
      const input = sent.reduce((sum, m) => sum + estimateTokens(m.content), 0);
      const output = Math.min(estimateTokens(content), settings.maxTokens);
      const usage = { input, output, costMicros: callCostMicros(model, input, output) };
      setTurns((t) => [...t, { id: nextId.current++, role: "assistant", content, modelId: model.id, usage }]);
      setPending(false);
    }, REPLY_DELAY_MS);
  }

  function stop() {
    if (timer.current) clearTimeout(timer.current);
    setPending(false);
  }

  function clear() {
    stop();
    setTurns([]);
  }

  const totals = turns.reduce(
    (sum, t) => (t.usage ? { tokens: sum.tokens + t.usage.input + t.usage.output, costMicros: sum.costMicros + t.usage.costMicros } : sum),
    { tokens: 0, costMicros: 0 },
  );

  return { settings, update, turns, history: buildMessages(settings.system, toHistory(turns)), pending, send, stop, clear, totals };
}
