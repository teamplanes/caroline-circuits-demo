// Marketing content scraped from carolinescircuits.com (Nov 2026). Images are hotlinked.
import type { BlogPost, Faq, LiveSlot, PressItem, Testimonial } from "../lib/types";

export const IMG = "https://carolinescircuits.com/public/assets/images/";
const BLOG = "https://www.carolinescircuits.com/blog/wp-content/uploads/";

export const images = {
  logo: IMG + "caroline-logo.png",
  heroBanner: IMG + "home-banner.jpg",
  about: IMG + "home-about-image.jpg",
  story: IMG + "my-story-sec3.png",
  clock: IMG + "cc-clock-img.jpg",
  fullBody: IMG + "full-body.jpg",
  freeTrial: IMG + "cc-free-trial-img.jpg",
  workout: IMG + "cc-workout-img.jpg",
  onlineClasses: IMG + "online-classes-sec1.jpg",
  card1: IMG + "card-image-1.jpg",
  card2: IMG + "card-image-2.jpg",
  card3: IMG + "card-image-3.jpg",
  checkIcon: IMG + "check-circle-icon.svg",
  classes: [
    IMG + "classes-image1.jpg",
    IMG + "classes-image2.jpg",
    IMG + "classes-image3.jpg",
    IMG + "classes-image4.jpg",
    IMG + "classes-image5.jpg",
    IMG + "classes-image6.jpg",
    IMG + "classes-image8.jpg",
    IMG + "classes-image10.png",
    IMG + "classes-image11.jpg",
    IMG + "classes-image12.jpg",
  ],
  yoga: IMG + "Saturday_Yoga_Classes_with_Amber.png",
  summerSeries: IMG + "day_summer_workout_series.png",
  absBlast: IMG + "cc-abs-blast-img.jpg",
  kickstart15: IMG + "kickstart15.png",
  fitAt50: IMG + "Fit_at_50_Sunday_Asset_Vertical_1080x1350px.jpg",
  fitAt50Book: IMG + "my-book-sec2.jpg",
  retreats: [
    IMG + "retreats-sec1.jpg",
    IMG + "retreats-sec2.png",
    IMG + "retreats-sec3.png",
    IMG + "retreats-sec4.png",
    IMG + "retreats-sec5.png",
    IMG + "retreats-sec6.jpg",
    IMG + "retreats-sec7.png",
  ],
  artah: IMG + "collaborations_ARTAH.jpeg",
  womensHealthCover: IMG + "WHCoverOct2025.jpeg",
};

export const brand = {
  name: "Caroline's Circuits",
  founder: "Caroline Idiens",
  founded: 2020,
  email: "hello@carolinescircuits.com",
  pressEmail: "press@carolinescircuits.com",
  colors: {
    plum: "#9B3F8C",
    mauve: "#814359",
    charcoal: "#45484E",
    ink: "#121014",
    blush: "#F7E9F3",
    orchid: "#D25BC0",
  },
};

export const socials = [
  { name: "YouTube", url: "https://www.youtube.com/@carolinescircuits" },
  { name: "Instagram", url: "https://www.instagram.com/carolinescircuits" },
  { name: "TikTok", url: "https://www.tiktok.com/@carolinescircuits" },
];

export const hero = {
  headline: "The fitness platform trusted by thousands of women worldwide",
  sub: "30 minute online classes designed to improve strength and overall fitness leading to great results.",
  image: images.heroBanner,
  quotes: [
    {
      quote: "Your classes have changed the way I view exercise now and totally transformed my body as well as my mind!",
      source: "Fitness columnist for The Telegraph",
    },
    { quote: "It's like having my own PT in my sitting room!", source: "As seen on This Morning" },
  ],
  stats: [
    { value: 4, suffix: "", label: "live classes a week" },
    { value: 30, suffix: " min", label: "per class" },
    { value: 500, suffix: "+", label: "on-demand workouts" },
    { value: 40, suffix: "+", label: "countries" },
  ],
};

export const promo = {
  code: "caroline20",
  percentOff: 20,
  text: "Use code caroline20 to save 20% off your first month of classes",
};

export const plans = [
  {
    id: "monthly" as const,
    name: "Monthly",
    price: 35,
    period: "month",
    billing: "Rolling monthly membership, available worldwide",
    cta: "Join monthly",
    features: [
      "4 live strength workouts per week as well as on demand",
      "Weekly yoga class with Amber",
      "2 years of past classes in the library - incl beginner, 10/15/30 minute classes",
      "Rolling monthly membership, available worldwide",
      "All fitness levels, minimal equipment",
    ],
  },
  {
    id: "annual" as const,
    name: "Annually",
    price: 385,
    wasPrice: 420,
    saving: 35, // 420 - 385: one month free
    period: "year",
    billing: "Rolling annual membership. Join for 12 months, pay for 11",
    cta: "Join annually",
    badge: "1 month free",
    features: [
      "4 live strength workouts per week as well as on demand",
      "Weekly yoga class with Amber",
      "2 years of past classes in the library - incl beginner, 10/15/30 minute classes",
      "Rolling annual membership, available worldwide",
      "All fitness levels, minimal equipment",
    ],
  },
];

export const membershipIncludes = [
  "4 live classes every week",
  "Recordings available immediately after the live class",
  "Hundreds of on-demand classes: abs only, 15 minute series, 10 minute series, beginners series, kettlebells and more",
  "Weekly yoga class with Amber",
  "Download and save your favourite classes",
  "Available worldwide",
  "Cancel anytime",
];

// day: 0 = Sunday. Times are UK (Europe/London).
export const liveSchedule: LiveSlot[] = [
  { id: "slot-mon", day: 1, timeUK: "09:00", title: "Full Body Sculpt", bodyArea: "full", durationMin: 30, instructor: "Caroline" },
  { id: "slot-tue", day: 2, timeUK: "14:00", title: "Arms & Abs", bodyArea: "upper", durationMin: 30, instructor: "Caroline" },
  { id: "slot-wed", day: 3, timeUK: "09:00", title: "Legs & Glutes", bodyArea: "lower", durationMin: 30, instructor: "Caroline" },
  { id: "slot-fri", day: 5, timeUK: "09:00", title: "Strength HIIT", bodyArea: "hiit", durationMin: 30, instructor: "Caroline" },
  { id: "slot-sat-yoga", day: 6, timeUK: "08:00", title: "Yoga with Amber", bodyArea: "yoga", durationMin: 45, instructor: "Amber", prerecorded: true },
];

export const scheduleDescriptions: Record<string, string> = {
  "slot-mon": "30 minute workouts focusing on all the muscle groups. Strength based; option of weights or no equipment.",
  "slot-tue": "30 minute Arms & Abs workouts. Upper body focused, strength based; option of weights or no equipment.",
  "slot-wed": "30 minutes focused on the lower body. Resistance bands and weights if you have them; all classes can be done without equipment.",
  "slot-fri": "Strength HIIT workout, more cardio focused; option of weights or no equipment.",
  "slot-sat-yoga": "Weekly pre-recorded yoga class with Amber.",
};

export const onDemandSeries = [
  { name: "Summer Series", description: "7 day summer workout series.", image: images.summerSeries },
  { name: "In Ten Series", description: "Ten minute workouts, each focusing on a different muscle group. Stackable or standalone.", image: images.classes[4] },
  { name: "15 Min Express Series", description: "15 minute express workouts.", image: images.classes[5] },
  { name: "Abs Blast Series", description: "An abs only series.", image: images.absBlast },
  { name: "Beginner Series", description: "A series for those just getting started.", image: images.classes[6] },
  { name: "Bands Classes", description: "Bands only workouts, suited to taking on holiday.", image: images.classes[7] },
  { name: "Kettlebell Classes", description: "Kettlebell classes, added due to popular demand.", image: images.classes[8] },
  { name: "Mini Workouts", description: "Recorded mini workouts. Use the warm up and cool down beforehand.", image: images.classes[9] },
  { name: "Kickstart15 Series", description: "The kickstart15 classes.", image: images.kickstart15 },
];

export const kit = [
  { item: "A mat", note: "Any exercise mat will do." },
  { item: "Dumbbells", note: "Start with 2kg and 4kg and build up over time." },
  { item: "Short looped resistance band", note: "For legs day. The Gritin ones on Amazon are about £8." },
];

export const freeClasses = [
  { slug: "full-body-sculpt", title: "Full Body Sculpt", durationMin: 30, bodyArea: "full" as const, image: images.fullBody },
  { slug: "upper-body-sculpt", title: "Upper Body Sculpt", durationMin: 30, bodyArea: "upper" as const, image: images.card1 },
  { slug: "lower-body-sculpt", title: "Lower Body Sculpt", durationMin: 30, bodyArea: "lower" as const, image: images.card2 },
  { slug: "20-minute-strength-hiit", title: "20 Minute Strength HIIT", durationMin: 20, bodyArea: "hiit" as const, image: images.card3 },
  { slug: "15-minute-express", title: "15 Minute Express", durationMin: 15, bodyArea: "full" as const, image: images.classes[0] },
  { slug: "10-minute-glute", title: "10 Minute Glute", durationMin: 10, bodyArea: "lower" as const, image: images.classes[1] },
  { slug: "10-minute-abs", title: "10 Minute Abs", durationMin: 10, bodyArea: "core" as const, image: images.absBlast },
  { slug: "beginner", title: "Beginner", durationMin: 15, bodyArea: "full" as const, image: images.workout },
];

export const freeWorkoutPage = {
  headline: "FREE home workout",
  intro:
    "Are you a beginner? Not sure where to get started? Try a snippet of a 15 minute beginner workout below. Or maybe you're looking to shake up your fitness regimen! Take a look below and try a class for free.",
  formCopy:
    "Just put your name and email in the form below to receive the class straight to your inbox - sometimes they do end up in junk so be sure to check!",
  submitLabel: "Send me the class",
};

export const testimonials: Testimonial[] = [
  { name: "Georgie", location: "UK", tag: "beginner", quote: "I am a beginner and she is so clear in her instructions, always giving options and not judgemental. I can go at my own pace in the classes and in my own home. I feel genuinely amazed at how much fitter I've become in just 3 months.", result: "Fitter in 3 months, now upping her weights" },
  { name: "Sarah", location: "UK", tag: "busy", quote: "I have always done Caroline's classes on record when I get in from work in the evening as I cannot join them live. I genuinely look forward to doing them as I know that I will feel 100% better afterwards! I laugh, I shout and I feel so much better for challenging myself. And the best bit? I'm now seeing the results!", result: "Does the recordings after work" },
  { name: "Linda", location: "UK", age: 66, tag: "60+", quote: "Just a quick note to say how much I am enjoying your classes. The variety is great! I really appreciate being able to do the classes at a time that suits me so I never have to miss out. Ps. 66 years young and determined to regain my super strong body.", result: "66 years young" },
  { name: "Catherine", location: "UK", tag: "midlife", quote: "I am so impressed how my strength has increased. At first I struggled to keep up with you and now I mostly can. And have even moved to 4kg from 3 for some of the exercises. Because I'm stronger now my recovery has been much quicker.", result: "Moved from 3kg to 4kg weights" },
  { name: "Rebecca", location: "UK", tag: "midlife", quote: "I have been doing Caroline's leg classes now for 8 months and have never felt stronger in all my years at a gym!! Every class is different, keeping you challenged.", result: "Strongest ever after 8 months" },
  { name: "Sophia", location: "Spain", tag: "runner", quote: "The sessions really helped me in my other daily sports, building on my strength levels and challenging me in new areas. I have now done them for 6 months & find the 30 minute sessions fit perfectly into the day.", result: "Stronger in her other sports" },
  { name: "Member", location: "UK", tag: "runner", quote: "Hit my 5k PB thanks to a stronger core and glutes!", result: "New 5k PB" },
  { name: "Nicky", location: "USA", tag: "beginner", quote: "30 minutes of fast paced full body workouts, clear & easy instructions from the ever smiling and upbeat Caroline. I would really recommend these sessions whether you are a beginner or exercise regularly." },
  { name: "Emma", location: "UK", tag: "busy", quote: "Caroline's classes certainly mean business! Intense, fast paced, 30 minute sessions which offer tons of variety and fantastic full body workouts. Better still I can do them from home!" },
  { name: "Harriet", location: "France", tag: "busy", quote: "I love Caroline's circuits, they are tough but so worth it. They leave you buzzing all day!" },
  { name: "Laura", location: "Australia", tag: "busy", quote: "Thank you so much for the mix of exercises in today's class. They've boosted me so much and that is just what I needed this morning!" },
  { name: "Ira", location: "UK", tag: "midlife", quote: "I just had to drop you a line after doing the Wednesday class. It was fabulous. You really are an encouragement and it's so lovely being able to do the classes in my own time." },
  { name: "Colleen", location: "Jacksonville, Florida, USA", tag: "midlife", quote: "I tacked on those five beautiful minutes of bodyweight moves to the end of my workout this morning. My mood was lifted!! Simplicity can breed positivity." },
  { name: "Harriet", location: "UK", tag: "beginner", quote: "I completed my first week of workouts with you this week and loved it! I feel like this has definitely helped me get my exercise mojo back.", result: "Finished week 1, mojo back" },
  { name: "Member", location: "UK", tag: "midlife", quote: "Finished 3 weeks and already feel stronger and leaner.", result: "Stronger and leaner in 3 weeks" },
];

export const faqs: Faq[] = [
  { category: "Classes", question: "What time are the live classes?", answer: "Live classes (UK time) are recorded and available anytime: Monday 9am full body, Tuesday 2pm arms and abs, Wednesday 9am legs and glutes, Friday 9am strength HIIT." },
  { category: "Classes", question: "Can you do classes any time if you can't make the live?", answer: "Yes, classes are available immediately after the live class to do at any time that suits." },
  { category: "Getting started", question: "What equipment do I need to get started?", answer: "A mat, a short loop resistance band (the Gritin ones on Amazon are about £8) and a couple of dumbbells. Start with 2 and 4kg and increase weight over time." },
  { category: "Getting started", question: "Can I try a class for free?", answer: "Yes, you can try several classes for free via the free workout page." },
  { category: "Classes", question: "Do classes include a warm up and cool down?", answer: "Yes, all classes have a thorough warm up and cool down." },
  { category: "Membership", question: "What's included in the membership?", answer: "4 live classes every week (recorded and available immediately after), a library of hundreds of on-demand classes, a 10 minute series, a 15 minute series, yoga, kettlebell, a beginner series, and an abs only series." },
  { category: "App", question: "Is there an app?", answer: "Yes, the app gives access to everything on the website, plus saving favourites, scheduling in your diary, a watch later list, downloads for offline use, and filtering. Log in with your website details; it is available on Apple and Google Play." },
  { category: "Membership", question: "I don't live in the UK, can I join?", answer: "Yes, members come from all over the world and because all classes are recorded you can join anytime from anywhere." },
  { category: "Getting started", question: "I'm a beginner, can I still join?", answer: "Yes, there is a beginner series of 20-25 minutes plus 10 and 15 minute series. You can pause videos for longer rests and start body weight only, adding small weights over time." },
  { category: "Membership", question: "How much is the membership?", answer: "£35 per month, or £385 per year if you join annually. Both give access to all live and on-demand classes." },
  { category: "Membership", question: "How much is it in USD (or another currency)?", answer: "The membership is always £35 per month, converted by your bank, so the local amount depends on the exchange rate (around $44 per month)." },
  { category: "Classes", question: "Do you offer alternative exercises and modifications?", answer: "Yes, low impact or different ways to do an exercise are offered so you can modify to suit your fitness level and body." },
  { category: "Support", question: "Do you offer 1-2-1 support and dietary advice?", answer: "Customer services can help with queries by email, but there is no 1-2-1 dietary advice because Caroline is not a trained nutritionist." },
  { category: "App", question: "Can you cast to your TV?", answer: "It depends on your TV. You can log in to the website from your TV's browser if supported, or cast from your phone; videos are powered by Vimeo, so logging in on the TV is easier." },
  { category: "Membership", question: "Can I pause my membership and come back again?", answer: "Yes, pause from your my account page and restart anytime." },
  { category: "Membership", question: "Can I cancel anytime?", answer: "Yes, cancel from your my account page. There is no minimum term, and the subscription auto-renews unless cancelled." },
  { category: "Getting started", question: "Can anyone join?", answer: "Classes are designed for anyone at any fitness level. If you are new to exercise or returning from injury, get clearance from your healthcare provider or physio first." },
  { category: "Support", question: "How do I contact customer services?", answer: "Email hello@carolinescircuits.com." },
  { category: "Support", question: "I am experiencing issues with the app, what should I do?", answer: "Raise a support ticket with the email address associated with your membership to hand." },
];

export const blogPosts: BlogPost[] = [
  { id: "b1", title: "Nervous About Strength Training? Let's Make It Less Intimidating", date: "2026-11-04", cover: BLOG + "2026/10/NEW-Carolines-Circuits-blog-covers-3-1024x640.png", url: "https://www.carolinescircuits.com/blog/2026/11/04/nervous-about-strength-training-lets-make-it-less-intimidating/", excerpt: "Never lifted a weight? Start here: simple moves, light dumbbells and zero judgement.", relatedBodyArea: "full" },
  { id: "b2", title: "Why Fat Around the Tummy Can Be Harder to Shift in Midlife", date: "2026-10-27", cover: BLOG + "2026/10/NEW-Carolines-Circuits-blog-covers-10-1024x640.jpg", url: "https://www.carolinescircuits.com/blog/2026/10/27/why-fat-around-the-tummy-can-be-harder-to-shift-in-midlife/", excerpt: "Hormones, muscle and stress all play a part. Here's what actually helps.", relatedBodyArea: "core" },
  { id: "b3", title: "How to Adapt Exercise When Your Lower Body Hurts", date: "2026-10-20", cover: BLOG + "2026/10/NEW-Carolines-Circuits-blog-covers-9-1024x640.jpg", url: "https://www.carolinescircuits.com/blog/2026/10/20/how-to-adapt-exercise-when-your-lower-body-hurts/", excerpt: "Sore knees or hips? Smart swaps that keep you moving and getting stronger.", relatedBodyArea: "lower" },
  { id: "b4", title: "Why Walking Might Be Exactly What You Need This Autumn", date: "2026-10-13", cover: BLOG + "2026/10/NEW-Carolines-Circuits-blog-covers-7-1024x640.jpg", url: "https://www.carolinescircuits.com/blog/2026/10/13/why-walking-might-be-exactly-what-you-need-this-autumn/", excerpt: "The underrated partner to strength training, and how to make it count.", relatedBodyArea: "mobility" },
  { id: "b5", title: "Bras & Burpees: Feeling Supported, Strong and Ready to Move!", date: "2026-10-06", cover: BLOG + "2026/10/Copy-of-Carolines-circuits-blog-covers-61-1024x640.jpg", url: "https://www.carolinescircuits.com/blog/2026/10/06/bras-burpees-feeling-supported-strong-and-ready-to-move/", excerpt: "The right support makes all the difference to how you move.", relatedBodyArea: "hiit" },
  { id: "b6", title: "Fit, Active… But What About Your Cholesterol?", date: "2026-09-29", cover: BLOG + "2026/09/Copy-of-Carolines-circuits-blog-covers-54-1024x640.jpg", url: "https://www.carolinescircuits.com/blog/2026/09/29/fit-active-but-what-about-your-cholesterol/", excerpt: "Why heart health deserves a place in your fitness plan.", relatedBodyArea: "hiit" },
  { id: "b7", title: "Why Your Brain Loves an Active Lifestyle", date: "2026-09-22", cover: BLOG + "2026/09/Copy-of-Carolines-circuits-blog-covers-51-1024x640.jpg", url: "https://www.carolinescircuits.com/blog/2026/09/22/why-your-brain-loves-an-active-lifestyle/", excerpt: "Mood, memory and focus: the mental payoff of moving every day.", relatedBodyArea: "full" },
  { id: "b8", title: "It's Not What You're Eating, It's Why", date: "2026-09-14", cover: BLOG + "2026/09/Copy-of-Carolines-circuits-blog-covers-47-1024x640.jpg", url: "https://www.carolinescircuits.com/blog/2026/09/14/its-not-what-youre-eating-its-why/", excerpt: "Understanding the habits behind the food choices." },
  { id: "b9", title: "How Heavy Should I Be Lifting?", date: "2026-09-08", cover: BLOG + "2026/09/Copy-of-Carolines-circuits-blog-covers-43-1024x640.jpg", url: "https://www.carolinescircuits.com/blog/2026/09/08/how-heavy-should-i-be-lifting-2/", excerpt: "A simple way to know when it's time to pick up the next dumbbell.", relatedBodyArea: "upper" },
  { id: "b10", title: "Your September Strength Reset", date: "2026-09-02", cover: BLOG + "2026/09/Copy-of-Carolines-circuits-blog-covers-42-1024x640.jpg", url: "https://www.carolinescircuits.com/blog/2026/09/02/your-september-strength-reset/", excerpt: "Back-to-school energy for your training routine.", relatedBodyArea: "full" },
  { id: "b11", title: "The Importance of Recovery", date: "2026-08-25", cover: BLOG + "2026/08/Copy-of-Carolines-circuits-blog-covers-41-1024x640.jpg", url: "https://www.carolinescircuits.com/blog/2026/08/25/the-importance-of-recovery/", excerpt: "Rest days are where the strength gets built.", relatedBodyArea: "yoga" },
];

export const press: PressItem[] = [
  { name: "Good Housekeeping", logo: IMG + "good-housekeeping.png" },
  { name: "Women's Fitness", logo: IMG + "womens-fitness.webp" },
  { name: "The Telegraph", logo: IMG + "the-telegraph.svg", quote: "Your classes have changed the way I view exercise now and totally transformed my body as well as my mind!" },
  { name: "The Times", logo: IMG + "the-times.png" },
  { name: "Red", logo: IMG + "logos-RED.png" },
  { name: "This Morning", logo: "", quote: "It's like having my own PT in my sitting room!", url: "https://www.youtube.com/watch?v=bb1t4eG_sIM" },
];

export const pressFeatures = [
  { publication: "Women's Health", headline: "Cover feature with Caroline, September 2025", image: images.womensHealthCover },
];

export const story = {
  title: "About Caroline",
  tagline: "A little bit about me, how did it all begin?",
  summary:
    "Caroline's passion is strength training: functional, resistance-based workouts that can be done at home in a short space of time, targeting all muscle groups. She has seen first-hand the benefits of being strong both physically and mentally, especially as we get older. In 2020 she took her strength classes online and founded Caroline's Circuits, now a global online community.",
  quote:
    "I wanted to create a fitness platform that would appeal to everyone - to those who have exercised for years and are looking for a new challenge as well as to those who are complete beginners.",
  mission: "To motivate and inspire members to lift weights and stay strong for longevity.",
  facts: [
    "Founded Caroline's Circuits in 2020",
    "Fitness columnist for The Telegraph",
    "As seen on This Morning",
    "Author of Fit at 50 (DK RED, 2025)",
  ],
  images: [images.about, images.clock, images.story],
};

export const extras = {
  fitAt50: {
    title: "Fit at 50",
    subtitle: "Your Guide to a Stronger, Fitter and Happier (Mid) Life in Just 6 Weeks",
    description:
      "Full-body strength and high-intensity workouts, 60 nutritionally balanced recipes and sample meal plans. Find out how to establish your fitness goals, progressively build to longer workouts and continue your fitness for decades to come.",
    publisher: "DK RED",
    published: "2025-03-06",
    cta: { label: "Order now", url: "https://geni.us/FitAt50_web" },
    images: [images.fitAt50, images.fitAt50Book],
  },
  retreats: {
    title: "Caroline's Circuits on Retreat",
    intro: "I am thrilled to be teaching on some amazing retreats, workshops & events in 2027.",
    venue: "Six Senses, Ibiza",
    description:
      "4 night retreat. Fitness classes with Caroline, full board Mediterranean cuisine, Six Senses wellbeing activities, spa treatments and a coastal hike.",
    status: "May sold out. New October dates coming soon: register your interest.",
    cta: "Register your interest",
    images: images.retreats,
  },
  collaborations: [
    {
      brand: "ARTAH",
      description:
        "Award-winning supplements brand blending cutting edge science with high-quality, natural ingredients. Caroline uses Enhanced NAD+ Complex, Metabolic Fix and Essential Creatine.",
      code: "CIRCUITS",
      discount: "15% off",
      image: images.artah,
    },
  ],
};

export const navLinks = [
  { label: "Classes", href: "/#classes" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Free workout", href: "/#free" },
  { label: "My story", href: "/#story" },
  { label: "Blog", href: "/#blog" },
  { label: "FAQ", href: "/#faq" },
];
