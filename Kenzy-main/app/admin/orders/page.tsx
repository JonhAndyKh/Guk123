"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STATUSES = ["ALL", "PENDING", "PAID", "PROCESSING", "DELIVERED", "FAILED", "REFUNDED", "CANCELLED"];

const PILL_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-400/10 text-yellow-400 border-yellow-400/30",
  PAID: "bg-blue-400/10 text-blue-400 border-blue-400/30",
  PROCESSING: "bg-blue-400/10 text-blue-400 border-blue-400/30",
  DELIVERED: "bg-green-400/10 text-green-400 border-green-400/30",
  FAILED: "bg-red-400/10 text-red-400 border-red-400/30",
  REFUNDED: "bg-fox-muted/10 text-fox-muted border-fox-border",
  CANCELLED: "bg-fox-muted/10 text-fox-muted border-fox-border",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [status, setStatus] = useState("ALL");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({ status, page: String(page) });
    if (q) params.set("q", q);
    const res = await fetch(`/api/admin/orders?${params}`);
    const data = await res.json();
    setOrders(data.orders);
    setTotalPages(data.totalPages);
    setLoading(false);

    // Always fetch count of orders that need fulfillment (PAID)
    try {
      const countRes = await fetch(`/api/admin/orders?status=PAID&page=1`);
      const countData = await countRes.json();
      setPendingCount(countData.total ?? countData.orders?.length ?? 0);
    } catch {
      /* ignore */
    }
  }

  async function clearAllOrders() {
    const scope = status === "ALL" ? "ALL orders (every status)" : `all ${status} orders`;
    const typed = window.prompt(
      `This will PERMANENTLY DELETE ${scope} from the database.\n\nType DELETE to confirm.`
    );
    if (typed !== "DELETE") return;

    const res = await fetch("/api/admin/orders/bulk", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: "DELETE", status }),
    });
    const data = await res.json();
    if (!res.ok) {
      window.alert(data.error || "Failed to delete orders.");
      return;
    }
    window.alert(`Deleted ${data.deleted} order(s).`);
    setPage(1);
    load();
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, page]);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
        <h1 className="font-display text-3xl font-bold">Orders</h1>
        <a
          href={`/api/admin/orders/export?${new URLSearchParams({ ...(status !== "ALL" && { status }), ...(q && { q }) }).toString()}`}
          className="btn-ghost text-xs"
        >
          ⬇ Export CSV
        </a>
      </div>
      <p className="text-fox-muted mb-6">All customer orders.</p>

      {pendingCount > 0 && status !== "PAID" && (
        <button
          onClick={() => { setStatus("PAID"); setPage(1); }}
          className="mb-6 flex w-full items-center justify-between rounded-2xl border border-fox-primary/50 bg-fox-primary/10 px-5 py-4 text-left transition-colors hover:bg-fox-primary/20"
        >
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-fox-primary opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-fox-primary" />
            </span>
            <div>
              <div className="font-display text-base font-bold text-fox-text">
                {pendingCount} order{pendingCount === 1 ? "" : "s"} waiting for fulfillment
              </div>
              <div className="text-xs text-fox-muted">Click to filter by PAID status and start topping up.</div>
            </div>
          </div>
          <span className="text-fox-primary">→</span>
        </button>
      )}

      <div className="card p-4 mb-6 flex flex-wrap gap-3">
        <div className="flex gap-1 flex-wrap">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatus(s);
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-colors ${
                status === s ? "bg-fox-primary text-black" : "bg-fox-surface text-fox-muted hover:text-fox-text"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <form
          className="flex gap-2 flex-1 min-w-[300px]"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            load();
          }}
        >
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search order #, UID, or email"
            className="input text-sm flex-1"
          />
          <button type="submit" className="btn-ghost text-sm px-4 py-2">Search</button>
        </form>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-fox-surface text-fox-muted text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-5 py-3">Order #</th>
                <th className="text-left px-5 py-3">Game</th>
                <th className="text-left px-5 py-3">Product</th>
                <th className="text-left px-5 py-3">UID</th>
                <th className="text-right px-5 py-3">Amount</th>
                <th className="text-left px-5 py-3">Payment</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-left px-5 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fox-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-fox-muted">
                    Loading...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center">
                    <div className="text-4xl mb-3">📦</div>
                    <p className="text-fox-muted mb-1">No orders match these filters</p>
                    <p className="text-xs text-fox-muted/60">Try adjusting the status filter or check back later.</p>
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className={`hover:bg-fox-surface/50 ${o.status === "PAID" ? "bg-fox-primary/5" : ""}`}>
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/orders/${o.orderNumber}`}
                        className="font-mono text-fox-primary hover:underline"
                      >
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-3">{o.game.name}</td>
                    <td className="px-5 py-3 text-fox-muted">{o.product.name}</td>
                    <td className="px-5 py-3 font-mono text-xs">{o.playerUid}</td>
                    <td className="px-5 py-3 text-right font-mono">${o.amountUsd.toFixed(2)}</td>
                    <td className="px-5 py-3 text-xs text-fox-muted">{o.paymentMethod.replace("_", " ")}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${PILL_COLORS[o.status]}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-fox-muted text-xs">
                      {new Date(o.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-fox-border flex justify-between items-center text-sm">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-ghost disabled:opacity-40 text-xs py-1 px-3"
            >
              ← Prev
            </button>
            <span className="text-fox-muted">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-ghost disabled:opacity-40 text-xs py-1 px-3"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Danger zone */}
      <div className="mt-10 card border-red-500/40 bg-red-500/5 p-5">
        <h2 className="font-display text-lg font-bold text-red-400 mb-1">Danger zone</h2>
        <p className="text-xs text-fox-muted mb-4">
          Permanently delete orders from the database. This action is irreversible and is recorded in the audit log.
          The current filter ({status === "ALL" ? "ALL statuses" : status}) will be used.
        </p>
        <button
          onClick={clearAllOrders}
          className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20 transition-colors"
        >
          Delete {status === "ALL" ? "all orders" : `all ${status} orders`}
        </button>
      </div>
    </div>
  );
}
