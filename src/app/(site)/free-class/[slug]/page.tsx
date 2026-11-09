import { redirect } from "next/navigation";
import { freeClasses } from "@/data/site";

export function generateStaticParams() {
  return freeClasses.map((c) => ({ slug: c.slug }));
}

/** Shareable free-class link: lands on the homepage player with that class loaded. */
export default async function FreeClassLink({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/?class=${encodeURIComponent(slug)}`);
}
