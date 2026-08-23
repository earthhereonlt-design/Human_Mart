import type { Metadata } from "next";
import { Dela_Gothic_One, Zen_Maru_Gothic, DotGothic16, Gochi_Hand } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/nav/Footer";
import { IntroCurtain } from "@/components/manga/IntroCurtain";
import { PageTurnWipe } from "@/components/manga/PageTurnWipe";
import { Bookmark } from "@/components/manga/Bookmark";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

const dela = Dela_Gothic_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-dela",
});

const zenMaru = Zen_Maru_Gothic({
  weight: ["500", "700"],
  subsets: ["latin"],
  variable: "--font-zenmaru",
});

const dot = DotGothic16({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-dot",
});

const gochi = Gochi_Hand({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-gochi",
});

export const metadata: Metadata = {
  title: {
    default: "Human Mart — A premium marketplace for human talents",
    template: "%s · Human Mart",
  },
  description:
    "People, with a price tag. Human Mart lists real people and their very real abilities — listed, rated, and purchased like the fine goods they are. Payments simulated.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  let userName: string | null = null;
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", user.id)
          .maybeSingle();
        userName = data?.display_name ?? null;
      }
    } catch {
      // not signed in or db unreachable — header shows signed-out state
    }
  }

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${dela.variable} ${zenMaru.variable} ${dot.variable} ${gochi.variable}`}
    >
      <head>
        {/* apply the saved chapter (theme) before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{if(localStorage.getItem('human-mart-theme')==='night')document.documentElement.dataset.theme='night'}catch(e){}})()",
          }}
        />
        {/* the cover opens once per session — hide the curtain pre-paint otherwise */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{if(sessionStorage.getItem('human-mart-intro')){document.documentElement.classList.add('intro-seen')}else{sessionStorage.setItem('human-mart-intro','1')}}catch(e){}})()",
          }}
        />
      </head>
      <body className="flex min-h-screen flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-ink focus:px-4 focus:py-2 focus:text-cream"
        >
          Skip to content
        </a>
        <Header userName={userName} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
        <IntroCurtain />
        <PageTurnWipe />
        <Bookmark />
      </body>
    </html>
  );
}
