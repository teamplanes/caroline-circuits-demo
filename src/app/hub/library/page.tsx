import { Suspense } from "react";
import { LibraryView } from "@/components/hub/library";

export default function LibraryPage() {
  return (
    <Suspense>
      <LibraryView />
    </Suspense>
  );
}
