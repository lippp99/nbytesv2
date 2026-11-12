"use client";

import Link from "next/link";
import { AlertCircleIcon } from "@hugeicons/core-free-icons";
import { primaryAction, secondaryAction } from "./button";
import { Card } from "./card";
import { EmptyState } from "./empty-state";

export type PageErrorCopy = { title: string; body: string; retry: string; home: string; ref: (digest: string) => string };

type PageErrorProps = { error: unknown; retry: () => void; home: string; copy: PageErrorCopy };

/**
 * Fallback of an error.tsx (dashboard and admin): the page failed, the frame around it keeps working.
 * Server errors reach the client with a generic message and a digest only, so the digest is all we show.
 */
export function PageError({ error, retry, home, copy }: PageErrorProps) {
  const digest = error instanceof Error && "digest" in error && typeof error.digest === "string" ? error.digest : null;
  return (
    <Card>
      <EmptyState icon={AlertCircleIcon} tone="danger" title={copy.title} body={copy.body} action={
        <span className="flex flex-col items-center gap-4">
          <span className="flex flex-wrap justify-center gap-2">
            <button type="button" onClick={() => retry()} className={primaryAction()}>{copy.retry}</button>
            <Link href={home} className={secondaryAction()}>{copy.home}</Link>
          </span>
          {digest && <span className="font-mono text-app-code text-app-text-3">{copy.ref(digest)}</span>}
        </span>
      } />
    </Card>
  );
}
