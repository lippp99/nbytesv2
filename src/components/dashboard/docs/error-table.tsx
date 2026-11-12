import { THead, Table, Td, Th, Tr } from "@/components/app-kit/table";
import { gatewayErrors } from "@/lib/gateway/error-contract";
import { cn } from "@/lib/utils";
import { docs, errorTextsFor } from "./docs-copy";
import { type DocErrorCode, PLAYGROUND_ONLY_CODES } from "./docs-errors";

const cols = docs.sections.errors.cols;
// Straight from the error contract: a new code shows up here (and fails the test until it has Indonesian text).
const rows = gatewayErrors.filter((e) => !PLAYGROUND_ONLY_CODES.includes(e.code));

/** Every public error: status, code, meaning and next step. 4xx (the request) warning, 5xx (our side) danger, always with words (D3). */
export function ErrorTable({ rate }: { rate: string }) {
  const errorTexts = errorTextsFor(rate);
  return (
    <div className="overflow-hidden rounded-app-card border border-app-border bg-app-surface">
      <Table minWidth="min-w-3xl">
        <THead>
          <Th className="w-20">{cols.status}</Th>
          <Th>{cols.code}</Th>
          <Th>{cols.meaning}</Th>
          <Th>{cols.action}</Th>
        </THead>
        <tbody>
          {rows.map((e) => {
            const text = errorTexts[e.code as DocErrorCode];
            return (
              <Tr key={e.code}>
                <Td className={cn("font-mono text-app-code font-medium", e.status >= 500 ? "text-app-danger" : "text-app-warning")}>
                  {e.status}
                </Td>
                <Td className="font-mono text-app-code">{e.code}</Td>
                <Td className="py-3 text-app-text">{text.meaning}</Td>
                <Td className="py-3 text-app-text-2">{text.action}</Td>
              </Tr>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
}
