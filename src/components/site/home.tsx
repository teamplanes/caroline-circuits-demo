"use client";

import { useEffect, useState } from "react";
import { MotionConfig } from "framer-motion";
import { freeClasses } from "@/data/site";
import { ChatWidget } from "@/components/ai/chat-widget";
import { Hero, PressMarquee } from "./hero";
import { PromoBanner, SiteNav } from "./nav";
import { AiOnboarding } from "./ai-onboarding";
import { FreeClass } from "./free-class";
import { Included } from "./included";
import { Schedule } from "./schedule";
import { Pricing } from "./pricing";
import { Testimonials } from "./testimonials";
import { KitAndCommunity } from "./community";
import { Blog, Faq, Story } from "./content";
import { Newsletter, SiteFooter } from "./footer";

export function SiteHome() {
  const [freeSlug, setFreeSlug] = useState("full-body-sculpt");

  // Deep link: /?class=<slug> (or /free-class/<slug>, which redirects here) opens that free class.
  useEffect(() => {
    const slug = new URLSearchParams(location.search).get("class");
    if (slug && freeClasses.some((c) => c.slug === slug)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- query string is browser-only
      setFreeSlug(slug);
      setTimeout(() => document.getElementById("free")?.scrollIntoView({ behavior: "smooth" }), 300);
    }
  }, []);

  function watch(slug: string) {
    setFreeSlug(slug);
    document.getElementById("free")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <MotionConfig reducedMotion="user">
      <PromoBanner />
      <SiteNav />
      <main>
        <Hero onQuiz={() => document.getElementById("start")?.scrollIntoView({ behavior: "smooth" })} />
        <PressMarquee />
        <AiOnboarding onWatch={watch} />
        <FreeClass slug={freeSlug} onSelect={setFreeSlug} />
        <Included />
        <Schedule />
        <Testimonials />
        <Pricing />
        <KitAndCommunity />
        <Story />
        <Blog onWatch={watch} />
        <Faq />
        <Newsletter />
      </main>
      <SiteFooter />
      <ChatWidget mode="sales" floating />
    </MotionConfig>
  );
}
