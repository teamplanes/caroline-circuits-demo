import type { ReactNode } from "react";
import { HubShell } from "@/components/hub/shell";

export const metadata = { title: "Member hub · Caroline's Circuits" };

export default function HubLayout({ children }: { children: ReactNode }) {
  return <HubShell>{children}</HubShell>;
}
