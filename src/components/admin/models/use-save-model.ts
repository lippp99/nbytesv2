"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ModelPriceBody } from "@/lib/gateway/catalog-contract";
import { saveModelPrice } from "@/lib/model-price-client";
import { modelPriceErrorText } from "./models-copy";

export type SaveNotice = { modelId: string; kind: "status" | "error"; text: string } | null;

/**
 * Save state of one table: the model being saved, the last notice, and save(). The rows come from the server, so a
 * success refreshes the route instead of patching local state. `savedText` says what changed (markup, on, off, added).
 */
export function useSaveModel() {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [notice, setNotice] = useState<SaveNotice>(null);

  async function save(body: ModelPriceBody, savedText: string): Promise<boolean> {
    setPending(body.modelId);
    setNotice(null);
    const result = await saveModelPrice(body);
    setPending(null);
    if (!result.ok) {
      if (result.error === "unauthorized") router.push("/admin/login");
      else setNotice({ modelId: body.modelId, kind: "error", text: modelPriceErrorText[result.error] });
      return false;
    }
    setNotice({ modelId: body.modelId, kind: "status", text: savedText });
    router.refresh();
    return true;
  }

  return { pending, notice, save };
}
