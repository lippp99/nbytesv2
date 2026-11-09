import type { Metadata } from "next";
import { ModelsView } from "@/components/admin/models/models-view";

export const metadata: Metadata = { title: "Model & harga · Admin" };

export default function Page() {
  return <ModelsView />;
}
