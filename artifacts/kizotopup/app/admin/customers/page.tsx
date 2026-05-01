"use client";

import { useEffect, useState } from "react";

interface Customer {
  key: string;
  email: string | null;
  phone: string | null;
  totalOrders: number;
  paidOrders: number;
  lifetimeUsd: number;
  lastOrderAt: string;
  uidCount: number;
}

export default function CustomersPage() {
  const [data, setData] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetch("/api/admin/customers");
      if (res.ok) {
        const d = await res.json();
        setData(d.customers);
      }
      setLoading(false);
    })();
  }, []);

  const filtered = q
    ? data.filter((c) => [c.email, c.phone, c.key].some((v) => (v || "").toLowerCase().includes(q.toLowerCase())))
    : data;

  return (
    <div className="p-4 sm:p-8">
      <h1 className="font-display text-2xl sm:text-3xl font-bold mb-2">Customers</h1>
      <p className="text-fox-muted text-sm mb-6">Aggregated by email or phone. Sorted by lifetime value.</p>

      <input
        className="input mb-4 max-w-md"
        placeholder="Search email / phone"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {loading ? (
        <div className="text-fox-muted text-sm">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center text-fox-muted text-sm">No customers yet.</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-fox-muted border-b border-fox-border">
              <tr>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4 text-right">Lifetime $</th>
                <th className="py-3 px-4 text-right">Paid orders</th>
                <th className="py-3 px-4 text-right">Total orders</th>
                <th className="py-3 px-4 text-right">UIDs</th>
                <th className="py-3 px-4">Last order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fox-border/60">
              {filtered.map((c) => (
                <tr key={c.key} className="hover:bg-fox-surface/40">
                  <td className="py-2 px-4">
                    <div className="font-medium">{c.email || c.phone || c.key}</div>
                    {c.email && c.phone && <div className="text-xs text-fox-muted">{c.phone}</div>}
                  </td>
                  <td className="py-2 px-4 text-right font-bold text-fox-primary">${c.lifetimeUsd.toFixed(2)}</td>
                  <td className="py-2 px-4 text-right">{c.paidOrders}</td>
                  <td className="py-2 px-4 text-right text-fox-muted">{c.totalOrders}</td>
                  <td className="py-2 px-4 text-right">{c.uidCount}</td>
                  <td className="py-2 px-4 text-xs text-fox-muted whitespace-nowrap">{new Date(c.lastOrderAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
