import type { Metadata } from "next";
import { Suspense } from "react";
import { Montserrat, Noto_Serif } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { DemoToolbar } from "@/components/demo-toolbar";
import { StoreProvider } from "@/lib/store";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const notoSerif = Noto_Serif({
  variable: "--font-noto-serif",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Caroline's Circuits — Demo",
  description: "Online strength classes for women: website, member hub and admin demo.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${montserrat.variable} ${notoSerif.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <StoreProvider>
          {/* usePathname suspends on routes with unknown params (cache components) */}
          <Suspense fallback={<div aria-hidden className="bg-ink fixed inset-x-0 top-0 z-[100] h-[var(--demo-bar-h)]" />}>
            <DemoToolbar />
          </Suspense>
          {children}
          <Toaster theme="light" position="bottom-right" richColors />
        </StoreProvider>
      </body>
    </html>
  );
}
