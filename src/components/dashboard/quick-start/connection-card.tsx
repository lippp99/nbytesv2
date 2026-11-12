import Link from "next/link";
import { ghostAction } from "@/components/app-kit/button";
import { Card } from "@/components/app-kit/card";
import { CopyButton } from "@/components/copy-button";
import { quickStartCopy } from "./quick-start-copy";

const copy = quickStartCopy.connection;

function Fact({ label, value, href, action }: { label: string; value: number; href: string; action: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <dt className="text-app-ui text-app-text-2">{label}</dt>
      <dd className="flex items-center gap-2">
        <span className="font-mono text-app-code tabular-nums">{value}</span>
        <Link href={href} className={ghostAction("-mr-2 text-app-accent-text", "sm")}>{action}</Link>
      </dd>
    </div>
  );
}

type ConnectionCardProps = { baseUrl: string; keyCount: number; modelCount: number };

/** What a client needs to connect: the base URL to copy, and how many keys and models it can use. */
export function ConnectionCard({ baseUrl, keyCount, modelCount }: ConnectionCardProps) {
  return (
    <Card title={copy.title} headerClassName="bg-app-inset">
      <div className="p-6">
        <p className="text-app-small text-app-text-2">{copy.baseUrl}</p>
        <div className="mt-2 flex items-center gap-2 rounded-app-control border border-app-border bg-app-inset py-1 pr-1 pl-3.5">
          <span className="min-w-0 flex-1 font-mono text-app-code break-all text-app-text">{baseUrl}</span>
          <CopyButton text={baseUrl} label={copy.copyBaseUrl} copiedLabel={copy.copiedBaseUrl} iconOnly className="rounded-app-inner" />
        </div>
        <dl className="mt-3 divide-y divide-app-border">
          <Fact label={copy.activeKeys} value={keyCount} href="/api-keys" action={copy.manage} />
          <Fact label={copy.models} value={modelCount} href="/models" action={copy.browse} />
        </dl>
      </div>
    </Card>
  );
}
