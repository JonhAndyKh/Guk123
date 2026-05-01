"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function AdminProductsPage() {
  const searchParams = useSearchParams();
  const gameIdFilter = searchParams.get("gameId") || "";

  const [games, setGames] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedGame, setSelectedGame] = useState(gameIdFilter);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);

  async function loadAll() {
    setLoading(true);
    const [gRes, pRes] = await Promise.all([
      fetch("/api/admin/games").then((r) => r.json()),
      fetch(`/api/admin/products${selectedGame ? `?gameId=${selectedGame}` : ""}`).then((r) => r.json()),
    ]);
    setGames(gRes);
    setProducts(pRes);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGame]);

  async function toggleActive(p: any) {
    await fetch(`/api/admin/products/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !p.active }),
    });
    await loadAll();
  }

  async function deleteProduct(p: any) {
    if (!confirm(`Delete "${p.name}"?`)) return;
    await fetch(`/api/admin/products/${p.id}`, { method: "DELETE" });
    await loadAll();
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold">Products</h1>
          <p className="text-fox-muted">Top-up packages for sale.</p>
        </div>
        <button onClick={() => setCreating(true)} className="btn-primary">+ Add Product</button>
      </div>

      <div className="card p-4 mb-6">
        <label className="label">Filter by game</label>
        <select
          className="input max-w-sm"
          value={selectedGame}
          onChange={(e) => setSelectedGame(e.target.value)}
        >
          <option value="">All games</option>
          {games.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </div>

      {(creating || editing) && (
        <ProductForm
          games={games}
          defaultGameId={selectedGame}
          initial={editing}
          onCancel={() => { setCreating(false); setEditing(null); }}
          onSaved={async () => { setCreating(false); setEditing(null); await loadAll(); }}
        />
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-fox-surface text-fox-muted text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-5 py-3">Game</th>
                <th className="text-left px-5 py-3">Name</th>
                <th className="text-right px-5 py-3">Amount</th>
                <th className="text-right px-5 py-3">Bonus</th>
                <th className="text-right px-5 py-3">Price USD</th>
                <th className="text-left px-5 py-3">Badge</th>
                <th className="text-center px-5 py-3">Active</th>
                <th className="text-right px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fox-border">
              {loading ? (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-fox-muted">Loading...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-16 text-center">
                    <div className="text-4xl mb-3">💎</div>
                    <p className="text-fox-muted mb-1">No products yet</p>
                    <p className="text-xs text-fox-muted/60 mb-3">Add packages for customers to purchase.</p>
                    <button onClick={() => setCreating(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-fox-primary px-4 py-2 text-sm font-semibold text-black hover:bg-fox-primary/90 transition-colors">+ Add Product</button>
                </td></tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-fox-surface/50">
                    <td className="px-5 py-3 text-fox-muted">{p.game.name}</td>
                    <td className="px-5 py-3 font-medium">{p.name}</td>
                    <td className="px-5 py-3 text-right font-mono">{p.amount.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right font-mono text-fox-accent">{p.bonus > 0 ? `+${p.bonus}` : "—"}</td>
                    <td className="px-5 py-3 text-right font-mono text-fox-primary">${p.priceUsd.toFixed(2)}</td>
                    <td className="px-5 py-3 text-xs">{p.badge || "—"}</td>
                    <td className="px-5 py-3 text-center">
                      <button onClick={() => toggleActive(p)}>
                        <span className={`inline-block h-5 w-9 rounded-full relative transition-colors ${p.active ? "bg-green-500" : "bg-fox-border"}`}>
                          <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${p.active ? "translate-x-4" : "translate-x-0.5"}`} />
                        </span>
                      </button>
                    </td>
                    <td className="px-5 py-3 text-right space-x-2">
                      <button onClick={() => setEditing(p)} className="text-fox-accent text-xs hover:underline">Edit</button>
                      <button onClick={() => deleteProduct(p)} className="text-red-400 text-xs hover:underline">Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ProductForm({ games, defaultGameId, initial, onCancel, onSaved }: any) {
  const [form, setForm] = useState({
    gameId: initial?.gameId || defaultGameId || games[0]?.id || "",
    name: initial?.name || "",
    amount: initial?.amount ?? 0,
    bonus: initial?.bonus ?? 0,
    priceUsd: initial?.priceUsd ?? 0,
    badge: initial?.badge || "",
    active: initial?.active ?? true,
    sortOrder: initial?.sortOrder ?? 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      ...form,
      amount: Number(form.amount),
      bonus: Number(form.bonus),
      priceUsd: Number(form.priceUsd),
      sortOrder: Number(form.sortOrder),
      badge: form.badge || null,
    };
    const url = initial ? `/api/admin/products/${initial.id}` : "/api/admin/products";
    const method = initial ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed");
      setSaving(false);
      return;
    }
    onSaved();
  }

  return (
    <form onSubmit={save} className="card p-6 mb-6">
      <h3 className="font-semibold text-lg mb-4">{initial ? "Edit Product" : "New Product"}</h3>
      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <div className="md:col-span-3">
          <label className="label">Game</label>
          <select
            className="input"
            value={form.gameId}
            onChange={(e) => setForm({ ...form, gameId: e.target.value })}
            disabled={!!initial}
            required
          >
            <option value="">— select —</option>
            {games.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <div className="md:col-span-3">
          <label className="label">Product Name (e.g. &quot;86 Diamonds&quot;)</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div>
          <label className="label">Amount (0 for passes)</label>
          <input className="input" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
        </div>
        <div>
          <label className="label">Bonus</label>
          <input className="input" type="number" value={form.bonus} onChange={(e) => setForm({ ...form, bonus: e.target.value })} />
        </div>
        <div>
          <label className="label">Price (USD)</label>
          <input className="input" type="number" step="0.01" value={form.priceUsd} onChange={(e) => setForm({ ...form, priceUsd: e.target.value })} required />
        </div>
        <div>
          <label className="label">Badge (Hot / Best Value / Pass / custom)</label>
          <input className="input" value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} />
        </div>
        <div>
          <label className="label">Sort Order</label>
          <input className="input" type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            Active
          </label>
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300 mb-4">{error}</div>}

      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving..." : initial ? "Save" : "Create"}</button>
        <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
      </div>
    </form>
  );
}
