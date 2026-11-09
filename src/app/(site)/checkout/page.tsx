import { Suspense } from "react";
import { Checkout } from "@/components/site/checkout";
import { SiteNav } from "@/components/site/nav";

export const metadata = { title: "Join · Caroline's Circuits" };

export default function CheckoutPage() {
  return (
    <>
      <SiteNav />
      <main className="relative flex-1 overflow-clip bg-plum-50/60 px-4 pt-10 pb-20">
        <Suspense fallback={<div className="mx-auto h-[600px] max-w-5xl animate-pulse rounded-[2rem] bg-white/60" />}>
          <Checkout />
        </Suspense>
      </main>
    </>
  );
}
