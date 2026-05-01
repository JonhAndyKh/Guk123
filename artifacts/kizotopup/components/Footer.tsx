import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative border-t border-fox-border/40 bg-fox-surface/40">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-fox-primary to-fox-accent">
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-black">
                  <path d="M12 2L3 7v6c0 5 3.5 9 9 10 5.5-1 9-5 9-10V7l-9-5z" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>
              <span className="font-display text-lg font-bold">
                RITH<span className="text-fox-primary">TOPUP</span>
              </span>
            </div>
            <p className="text-xs text-fox-muted leading-relaxed">
              Cambodia&apos;s fastest game top-up. Instant delivery, secure payment.
            </p>
          </div>

          {/* Links */}
          {[
            {
              heading: "Quick Links",
              items: [
                { label: "Home", href: "/" },
                { label: "All Games", href: "/#games" },
                { label: "Track Order", href: "/order" },
                { label: "FAQ", href: "/faq" },
                { label: "Blog", href: "/blog" },
              ],
            },
            {
              heading: "Payment",
              items: [
                { label: "KHQR", href: "#" },
                { label: "ABA Pay", href: "#" },
                { label: "Wing", href: "#" },
              ],
            },
            {
              heading: "Support",
              items: [
                { label: "Telegram: @rithtopup", href: "#" },
                { label: "24/7 Service", href: "#" },
              ],
            },
          ].map((col) => (
            <div key={col.heading}>
              <h4 className="font-semibold mb-3 text-xs uppercase tracking-wider text-fox-muted">{col.heading}</h4>
              <ul className="space-y-1.5 text-sm">
                {col.items.map((it) => (
                  <li key={it.label}>
                    <Link href={it.href} className="text-fox-text/70 transition-colors hover:text-fox-primary text-xs">
                      {it.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-fox-border/40 flex flex-col sm:flex-row justify-between items-center gap-3 text-[11px] text-fox-muted">
          <p>&copy; {new Date().getFullYear()} KIZOTOPUP. All rights reserved.</p>
          <p>Not affiliated with Moonton, Garena, Tencent or HoYoverse.</p>
        </div>
      </div>
    </footer>
  );
}
