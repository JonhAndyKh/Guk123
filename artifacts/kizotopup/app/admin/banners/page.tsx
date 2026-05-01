"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Save, X, Image as ImageIcon } from "lucide-react";

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  linkUrl: string | null;
  ctaLabel: string | null;
  active: boolean;
  sortOrder: number;
}

const empty = {
  title: "",
  subtitle: "",
  imageUrl: "",
  linkUrl: "",
  ctaLabel: "",
  active: true,
  sortOrder: 0,
};

export default function BannersAdminPage() {
  const [items, setItems] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/banners");
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function openNew() {
    setEditing(null);
    setForm(empty);
  }

  function openEdit(b: Banner) {
    setEditing(b);
    setForm({
      title: b.title,
      subtitle: b.subtitle ?? "",
      imageUrl: b.imageUrl,
      linkUrl: b.linkUrl ?? "",
      ctaLabel: b.ctaLabel ?? "",
      active: b.active,
      sortOrder: b.sortOrder,
    });
  }

  async function upload(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    if (res.ok) {
      const data = await res.json();
      setForm((f) => ({ ...f, imageUrl: data.url }));
    }
    setUploading(false);
  }

  async function save() {
    setSaving(true);
    const url = editing ? `/api/admin/banners/${editing.id}` : "/api/admin/banners";
    const method = editing ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        subtitle: form.subtitle || null,
        linkUrl: form.linkUrl || null,
        ctaLabel: form.ctaLabel || null,
      }),
    });
    if (res.ok) {
      setForm(empty);
      setEditing(null);
      await load();
    } else {
      alert("Save failed");
    }
    setSaving(false);
  }

  async function remove(id: string) {
    if (!confirm("Delete this banner?")) return;
    await fetch(`/api/admin/banners/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">Hero Banners</h1>
          <p className="text-fox-muted text-sm">Slides shown on the homepage carousel.</p>
        </div>
        <button onClick={openNew} className="btn-primary">
          <Plus className="h-4 w-4" /> New
        </button>
      </div>

      {/* Editor */}
      <div className="card p-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">{editing ? `Edit — ${editing.title}` : "New banner"}</h2>
          {editing && (
            <button onClick={openNew} className="text-xs text-fox-muted hover:text-fox-text inline-flex items-center gap-1">
              <X className="h-3 w-3" /> Cancel edit
            </button>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Title *</label>
            <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="label">Subtitle</label>
            <input className="input" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Image *</label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                className="input flex-1"
                placeholder="https://... or /uploads/..."
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              />
              <label className="btn-ghost cursor-pointer">
                <ImageIcon className="h-4 w-4" />
                {uploading ? "Uploading..." : "Upload"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
                />
              </label>
            </div>
            {form.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.imageUrl} alt="" className="mt-3 h-32 rounded-lg border border-fox-border object-cover" />
            )}
          </div>
          <div>
            <label className="label">Link URL</label>
            <input className="input" value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} placeholder="/games/pubg-mobile" />
          </div>
          <div>
            <label className="label">CTA Label</label>
            <input className="input" value={form.ctaLabel} onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })} placeholder="Top up now" />
          </div>
          <div>
            <label className="label">Sort order</label>
            <input type="number" className="input" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
              <span className="text-sm">Active</span>
            </label>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button onClick={save} disabled={saving || !form.title || !form.imageUrl} className="btn-primary">
            <Save className="h-4 w-4" /> {saving ? "Saving..." : editing ? "Save changes" : "Create banner"}
          </button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-fox-muted text-sm">Loading...</div>
      ) : items.length === 0 ? (
        <div className="card p-10 text-center text-fox-muted text-sm">No banners yet.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((b) => (
            <div key={b.id} className="card overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={b.imageUrl} alt="" className="h-40 w-full object-cover" />
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{b.title}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${b.active ? "bg-green-500/10 text-green-400" : "bg-fox-muted/10 text-fox-muted"}`}>
                    {b.active ? "LIVE" : "HIDDEN"}
                  </span>
                </div>
                {b.subtitle && <p className="text-xs text-fox-muted mt-1">{b.subtitle}</p>}
                <div className="mt-4 flex gap-2">
                  <button onClick={() => openEdit(b)} className="text-xs btn-ghost px-3 py-1.5">Edit</button>
                  <button onClick={() => remove(b.id)} className="text-xs text-red-400 hover:text-red-300 inline-flex items-center gap-1">
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
