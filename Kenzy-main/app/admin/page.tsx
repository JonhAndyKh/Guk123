import { prisma } from "@/lib/prisma";
import Link from "next/link";
import RevenueSparkline from "@/components/RevenueSparkline";
import {
  ShoppingBag,
  DollarSign,
  CheckCircle2,
  Clock,
  XCircle,
  Gamepad2,
  Package,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const now = new Date();
  const since = new Date(now);
  since.setDate(since.getDate() - 29);
  since.setHours(0, 0, 0, 0);

  const [
    totalOrders,
    pendingOrders,
    deliveredOrders,
    failedOrders,
    totalRevenue,
    recentOrders,
    gameCount,
    productCount,
    last30PaidOrders,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: "DELIVERED" } }),
    prisma.order.count({ where: { status: "FAILED" } }),
    prisma.order.aggregate({
      where: { status: { in: ["PAID", "DELIVERED"] } },
      _sum: { amountUsd: true },
    }),
    prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        game: { select: { name: true } },
        product: { select: { name: true } },
      },
    }),
    prisma.game.count({ where: { active: true } }),
    prisma.product.count({ where: { active: true } }),
    prisma.order.findMany({
      where: {
        status: { in: ["PAID", "DELIVERED"] },
        paidAt: { gte: since },
      },
      select: { paidAt: true, amountUsd: true },
    }),
  ]);

  // Aggregate last-30-days revenue.
  const dayKey = (d: Date) => d.toISOString().slice(0, 10);
  const buckets = new Map<string, { revenue: number; count: number }>();
  for (let i = 0; i < 30; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    buckets.set(dayKey(d), { revenue: 0, count: 0 });
  }
  for (const o of last30PaidOrders) {
    if (!o.paidAt) continue;
    const k = dayKey(o.paidAt);
    const b = buckets.get(k);
    if (b) {
      b.revenue += o.amountUsd;
      b.count += 1;
    }
  }
  const dailyRevenue = Array.from(buckets.entries()).map(([date, v]) => ({ date, ...v }));
  const last30Total = dailyRevenue.reduce((s, d) => s + d.revenue, 0);

  const stats = [
    { label: "Total Orders", value: totalOrders.toLocaleString(),                          color: "text-fox-text",    Icon: ShoppingBag, gradient: "from-fox-primary/20 to-fox-accent/5" },
    { label: "Revenue",      value: `$${(totalRevenue._sum.amountUsd ?? 0).toFixed(2)}`,   color: "text-fox-primary", Icon: DollarSign,  gradient: "from-fox-primary/25 to-fox-gold/5" },
    { label: "Delivered",    value: deliveredOrders.toLocaleString(),                      color: "text-green-400",   Icon: CheckCircle2, gradient: "from-green-500/20 to-green-500/5" },
    { label: "Pending",      value: pendingOrders.toLocaleString(),                        color: "text-yellow-400",  Icon: Clock,       gradient: "from-yellow-500/20 to-yellow-500/5" },
    { label: "Failed",       value: failedOrders.toLocaleString(),                         color: "text-red-400",     Icon: XCircle,     gradient: "from-red-500/15 to-red-500/5" },
    { label: "Active Games", value: gameCount.toString(),                                  color: "text-fox-accent",  Icon: Gamepad2,    gradient: "from-fox-accent/20 to-fox-accent/5" },
    { label: "Products",     value: productCount.toString(),                               color: "text-fox-accent",  Icon: Package,     gradient: "from-fox-accent/15 to-fox-gold/5" },
  ];

  return (
    <div className="p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">Dashboard</h1>
          <p className="text-fox-muted text-sm">Overview of your KIZOTOPUP operation.</p>
        </div>
        <Link href="/admin/orders" className="btn-primary">
          View all orders
          <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 mb-8">
        {stats.map((s) => (
          <div
            key={s.label}
            className="group relative overflow-hidden card p-4 transition-all duration-300 hover:border-fox-primary/40 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-fox-primary/10"
          >
            {/* Gradient overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br ${s.gradient} opacity-60 pointer-events-none rounded-2xl`} />

            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[10px] sm:text-xs text-fox-muted uppercase tracking-wider">{s.label}</div>
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-fox-surface/80 ${s.color} transition-transform duration-300 group-hover:scale-110`}>
                  <s.Icon className="h-4 w-4" strokeWidth={2} />
                </div>
              </div>
              <div className={`font-display text-xl sm:text-2xl font-bold ${s.color}`}>{s.value}</div>

              {/* CSS mini bar — purely decorative */}
              <div className="mt-3 h-1 rounded-full bg-fox-border overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${
                    s.color.includes("green") ? "from-green-500 to-green-400" :
                    s.color.includes("yellow") ? "from-yellow-500 to-yellow-400" :
                    s.color.includes("red") ? "from-red-500 to-red-400" :
                    "from-fox-primary to-fox-accent"
                  }`}
                  style={{ width: `${Math.min(100, Math.max(15, (Number(s.value.replace(/[$,]/g, "")) || 1) * 10))}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-fox-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-fox-primary" strokeWidth={2} />
            <h2 className="font-semibold">Revenue — last 30 days</h2>
          </div>
          <div className="text-xs text-fox-muted">
            <span className="text-fox-primary font-bold text-sm">${last30Total.toFixed(2)}</span> total
          </div>
        </div>
        <div className="p-4 sm:p-5">
          <RevenueSparkline data={dailyRevenue} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 my-8">
        {[
          { href: "/admin/banners", icon: "🖼️", label: "Banners" },
          { href: "/admin/faqs", icon: "❓", label: "FAQ" },
          { href: "/admin/blog", icon: "📝", label: "Blog" },
          { href: "/admin/customers", icon: "👥", label: "Customers" },
          { href: "/admin/banlist", icon: "🚫", label: "Banlist" },
          { href: "/admin/audit-logs", icon: "📜", label: "Audit" },
        ].map((q) => (
          <Link
            key={q.href}
            href={q.href}
            className="card p-4 text-center hover:border-fox-primary/40 hover:-translate-y-0.5 transition-all"
          >
            <div className="text-2xl mb-1">{q.icon}</div>
            <div className="text-xs font-medium">{q.label}</div>
          </Link>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-fox-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-fox-primary" strokeWidth={2} />
            <h2 className="font-semibold">Recent Orders</h2>
          </div>
          <Link href="/admin/orders" className="text-sm text-fox-primary hover:underline">See all</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-fox-surface text-fox-muted text-[10px] sm:text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 sm:px-5 py-3">Order #</th>
                <th className="text-left px-4 sm:px-5 py-3">Game</th>
                <th className="text-left px-4 sm:px-5 py-3 hidden md:table-cell">Product</th>
                <th className="text-left px-4 sm:px-5 py-3 hidden lg:table-cell">UID</th>
                <th className="text-right px-4 sm:px-5 py-3">Amount</th>
                <th className="text-left px-4 sm:px-5 py-3">Status</th>
                <th className="text-left px-4 sm:px-5 py-3 hidden md:table-cell">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fox-border">
              {recentOrders.map((o) => (
                <tr key={o.id} className="hover:bg-fox-surface/50 transition-colors">
                  <td className="px-4 sm:px-5 py-3">
                    <Link href={`/admin/orders/${o.orderNumber}`} className="font-mono text-fox-primary hover:underline text-xs sm:text-sm">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 sm:px-5 py-3 text-xs sm:text-sm">{o.game.name}</td>
                  <td className="px-4 sm:px-5 py-3 text-fox-muted text-xs sm:text-sm hidden md:table-cell">{o.product.name}</td>
                  <td className="px-4 sm:px-5 py-3 font-mono text-xs hidden lg:table-cell">{o.playerUid}</td>
                  <td className="px-4 sm:px-5 py-3 text-right font-mono text-xs sm:text-sm">${o.amountUsd.toFixed(2)}</td>
                  <td className="px-4 sm:px-5 py-3">
                    <StatusPill status={o.status} />
                  </td>
                  <td className="px-4 sm:px-5 py-3 text-fox-muted text-xs hidden md:table-cell">
                    {new Date(o.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <Package className="h-10 w-10 text-fox-muted/30 mx-auto mb-3" />
                    <p className="text-fox-muted mb-1">No orders yet</p>
                    <p className="text-xs text-fox-muted/60">Orders will appear here once customers start purchasing.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PENDING: "bg-yellow-400/10 text-yellow-400 border-yellow-400/30",
    PAID: "bg-blue-400/10 text-blue-400 border-blue-400/30",
    PROCESSING: "bg-blue-400/10 text-blue-400 border-blue-400/30",
    DELIVERED: "bg-green-400/10 text-green-400 border-green-400/30",
    FAILED: "bg-red-400/10 text-red-400 border-red-400/30",
    REFUNDED: "bg-fox-muted/10 text-fox-muted border-fox-border",
    CANCELLED: "bg-fox-muted/10 text-fox-muted border-fox-border",
  };
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${colors[status] || ""}`}>
      {status}
    </span>
  );
}
