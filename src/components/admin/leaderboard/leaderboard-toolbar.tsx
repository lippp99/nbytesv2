"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { periodCopy } from "@/components/admin/shared/period-copy";
import { type PeriodPickerProps, PeriodPicker } from "@/components/admin/shared/period-picker";
import { leaderboardHref } from "@/lib/admin-gateway/leaderboard-contract";

type LeaderboardToolbarProps = Omit<PeriodPickerProps, "pending" | "onPick">;

/** The period, kept in the URL so the server ranks again; the old lists stay until the new ones arrive. */
export function LeaderboardToolbar(props: LeaderboardToolbarProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <PeriodPicker {...props} pending={pending}
        onPick={(period) => startTransition(() => router.push(leaderboardHref(period, props.currentMonth), { scroll: false }))} />
      <span role="status" className="text-app-small text-app-text-2">{pending ? periodCopy.loading : ""}</span>
    </div>
  );
}
