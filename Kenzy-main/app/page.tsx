import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GameCard from "@/components/GameCard";
import RecentOrdersTicker from "@/components/RecentOrdersTicker";
import HeroCarousel from "@/components/HeroCarousel";
import Link from "next/link";
import { Zap, ShieldCheck, BadgePercent, Gamepad2, UserRoundCheck, CreditCard, ArrowRight, Search, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [games, banners] = await Promise.all([
    prisma.game.findMany({
      where: { active: true },
      orderBy: [{ featured: "desc" }, { sortOrder: "asc" }],
    }),
    prisma.heroBanner.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return (
    <>
      <Header />

      {banners.length > 0 && (
        <div className="pt-6">
          <HeroCarousel banners={banners} />
        </div>
      )}

      {/* Hero — clean & compact */}
      <section className="relative overflow-hidden py-16 sm:py-24">
        {/* Subtle background blobs */}
        <div className="pointer-events-none absolute top-0 left-1/4 h-96 w-96 rounded-full bg-fox-primary/10 blur-[120px] animate-float" />
        <div className="pointer-events-none absolute bottom-0 right-1/4 h-80 w-80 rounded-full bg-fox-accent/8 blur-[120px] animate-float-slow" />

        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-fox-primary/30 bg-fox-primary/10 px-4 py-1.5 text-xs font-medium text-fox-primary mb-6 fade-up backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-fox-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-fox-primary" />
            </span>
            24/7 Instant Delivery
          </div>

          <h1 className="font-display text-4xl sm:text-6xl font-bold tracking-tight fade-up" style={{ animationDelay: "0.1s" }}>
            Game Top-Ups, <span className="shine-text">Instant.</span>
          </h1>

          <p className="mt-4 text-base sm:text-lg text-fox-muted max-w-xl mx-auto fade-up leading-relaxed" style={{ animationDelay: "0.2s" }}>
            Mobile Legends, Free Fire, PUBG, Genshin Impact &amp; more.
            Enter your UID, pay, done.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 fade-up" style={{ animationDelay: "0.3s" }}>
            <Link href="#games" className="btn-primary group text-base py-3.5 px-8">
              <Sparkles className="h-5 w-5" strokeWidth={2.5} />
              Top Up Now
              <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={2.5} />
            </Link>
            <Link href="/order" className="btn-ghost py-3.5 px-8">
              <Search className="h-4 w-4" strokeWidth={2} />
              Track Order
            </Link>
          </div>
        </div>
      </section>

      {/* Recent orders ticker */}
      <RecentOrdersTicker />

      {/* Games grid */}
      <section id="games" className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-2">Choose Your Game</h2>
          <p className="text-fox-muted text-sm">Tap a game to top up instantly</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {games.map((game, i) => (
            <div
              key={game.id}
              className="fade-up"
              style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
            >
              <GameCard
                slug={game.slug}
                name={game.name}
                publisher={game.publisher}
                currencyName={game.currencyName}
                imageUrl={game.imageUrl}
                featured={game.featured}
              />
            </div>
          ))}
        </div>

        {games.length === 0 && (
          <div className="text-center py-20 text-fox-muted">
            <p>
              No games yet. Run{" "}
              <code className="text-fox-primary font-mono">npm run db:seed</code> to populate.
            </p>
          </div>
        )}
      </section>

      {/* How it works — 3 simple steps */}
      <section className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-2">How It Works</h2>
          <p className="text-fox-muted text-sm">Three steps. Under a minute.</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-5">
          {[
            { step: "01", Icon: Gamepad2, title: "Pick a Game", desc: "Choose from our catalog of popular games." },
            { step: "02", Icon: UserRoundCheck, title: "Enter UID", desc: "Just your player ID — no password needed." },
            { step: "03", Icon: CreditCard, title: "Pay & Receive", desc: "Pay with KHQR. Credits arrive instantly." },
          ].map((s, i) => (
            <div
              key={s.step}
              className="group relative rounded-2xl border border-fox-border/60 bg-fox-card/60 p-6 text-center transition-all duration-500 hover:border-fox-primary/50 hover:-translate-y-1 hover:shadow-xl hover:shadow-fox-primary/10 fade-up"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-fox-primary/20 to-fox-accent/10 border border-fox-primary/20 text-fox-primary mb-4 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                <s.Icon className="h-6 w-6" strokeWidth={2} />
              </div>
              <div className="text-[10px] font-bold text-fox-primary tracking-widest mb-2">STEP {s.step}</div>
              <h3 className="font-display text-lg font-bold mb-1">{s.title}</h3>
              <p className="text-sm text-fox-muted">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features — compact row */}
      <section className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-3 gap-5">
          {[
            { Icon: Zap, title: "Instant Delivery", desc: "Credits arrive in seconds, 24/7." },
            { Icon: ShieldCheck, title: "100% Secure", desc: "Only your UID needed. No passwords." },
            { Icon: BadgePercent, title: "Best Prices", desc: "Competitive rates with regular promos." },
          ].map((f, i) => (
            <div
              key={f.title}
              className="group flex items-start gap-4 rounded-2xl border border-fox-border/40 bg-fox-surface/40 p-5 transition-all duration-500 hover:border-fox-primary/40 hover:bg-fox-surface/70 fade-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-fox-primary/10 text-fox-primary transition-transform duration-500 group-hover:scale-110">
                <f.Icon className="h-5 w-5" strokeWidth={2} />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm mb-1">{f.title}</h3>
                <p className="text-xs text-fox-muted leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-2">FAQ</h2>
        </div>

        <div className="space-y-3">
          {[
            { q: "How long does delivery take?", a: "Instant — seconds after payment confirms. Up to 5 minutes during peak hours." },
            { q: "Is this safe for my account?", a: "Yes. We only need your UID — never your password. Orders go through licensed distributors." },
            { q: "What payment methods?", a: "KHQR supported (ABA, Wing, etc). More methods coming soon." },
            { q: "Wrong UID?", a: "Contact us on Telegram @rithtopup immediately. We can fix it before delivery." },
            { q: "Do I get in-game bonuses?", a: "Yes! All first-time and event bonuses apply — same as topping up in-game." },
          ].map((item, i) => (
            <details
              key={i}
              className="group rounded-xl border border-fox-border/60 bg-fox-card/40 transition-all duration-300 open:border-fox-primary/50 open:bg-fox-surface/60"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between p-5 font-semibold text-sm">
                {item.q}
                <span className="ml-4 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-fox-border text-fox-primary transition-transform duration-300 group-open:rotate-45 group-open:border-fox-primary/50">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
              </summary>
              <p className="px-5 pb-5 text-sm text-fox-muted leading-relaxed">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative mx-auto max-w-5xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl border border-fox-primary/30 bg-gradient-to-br from-fox-primary/15 via-fox-accent/8 to-transparent p-8 sm:p-12 text-center">
          <div className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-fox-primary/20 blur-[80px]" />
          <h3 className="relative font-display text-2xl sm:text-3xl font-bold mb-2">
            Ready to top up? <span className="text-gradient">Let&apos;s go.</span>
          </h3>
          <p className="relative text-fox-muted text-sm mb-6">Pick a game and finish in under a minute.</p>
          <Link href="#games" className="btn-primary relative">
            Browse Games
            <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </Link>
        </div>
      </section>

      <Footer />
    </>
  );
}
