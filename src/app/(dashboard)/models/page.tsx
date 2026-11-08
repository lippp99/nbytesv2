import type { Metadata } from "next";
import { ModelsView } from "@/components/dashboard/models/models-view";

export const metadata: Metadata = { title: "Models" };

export default function Page() {
  return <ModelsView />;
}
