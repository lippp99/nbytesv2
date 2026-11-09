import Link from "next/link";
import { apiKeys } from "@/components/dashboard/shared/dashboard-data";
import { ghostAction } from "@/components/app-kit/button";
import { Card } from "@/components/app-kit/card";
import { CodeBlock } from "@/components/app-kit/code-block";
import { BASE_URL, mockModels } from "@/lib/model-catalog";
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

/** What a client needs to connect: the base URL to copy, and how many keys and models it can use. */
export function ConnectionCard() {
  return (
    <Card title={copy.title}>
      <div className="p-6">
        <CodeBlock title={copy.baseUrl} code={BASE_URL} wrap />
        <dl className="mt-3 divide-y divide-app-border">
          <Fact label={copy.activeKeys} value={apiKeys.length} href="/api-keys" action={copy.manage} />
          <Fact label={copy.models} value={mockModels.length} href="/models" action={copy.browse} />
        </dl>
      </div>
    </Card>
  );
}
