import { Suspense } from "react";
import { buildSeed } from "@/data/mock";
import { ClassPlayer } from "@/components/hub/class-player";

// Class ids don't depend on the date, so any fixed seed date gives the full list.
export function generateStaticParams() {
  return buildSeed(new Date("2026-01-01T00:00:00Z")).classes.map((c) => ({ id: c.id }));
}

export default function ClassPage() {
  return (
    <Suspense>
      <ClassPlayer />
    </Suspense>
  );
}
