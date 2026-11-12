"use client";

import { type ReactNode, createContext, useContext, useState } from "react";
import { type Notice, NoticeLine } from "@/components/app-kit/notice-line";

const SetNotice = createContext<(notice: Notice | null) => void>(() => {});

/** The status dialogs in the rows report here, so the result stays visible even when the row leaves the filtered list. */
export function UsersFeedback({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState<Notice | null>(null);
  return (
    <SetNotice.Provider value={setNotice}>
      {notice && <NoticeLine notice={notice} className="mb-3" />}
      {children}
    </SetNotice.Provider>
  );
}

export const useUsersNotice = () => useContext(SetNotice);
