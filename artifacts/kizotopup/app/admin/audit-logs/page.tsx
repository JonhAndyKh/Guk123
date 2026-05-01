import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AuditLogsPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="p-4 sm:p-8">
      <h1 className="font-display text-2xl sm:text-3xl font-bold mb-2">Audit Log</h1>
      <p className="text-fox-muted text-sm mb-6">Every admin action in the last 200 events.</p>

      {logs.length === 0 ? (
        <div className="card p-10 text-center text-fox-muted text-sm">No events yet.</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-fox-muted border-b border-fox-border">
              <tr>
                <th className="py-3 px-4">When</th>
                <th className="py-3 px-4">Admin</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fox-border/60">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-fox-surface/40">
                  <td className="py-2 px-4 text-fox-muted whitespace-nowrap">{new Date(l.createdAt).toLocaleString()}</td>
                  <td className="py-2 px-4">{l.adminEmail || "—"}</td>
                  <td className="py-2 px-4 font-mono text-xs text-fox-accent">{l.action}</td>
                  <td className="py-2 px-4 text-xs">
                    {l.targetType && <span className="text-fox-muted">{l.targetType}</span>}
                    {l.targetId && <span className="font-mono text-fox-muted/70 ml-1">{l.targetId.slice(-8)}</span>}
                  </td>
                  <td className="py-2 px-4 text-xs text-fox-muted max-w-sm truncate" title={l.details ?? undefined}>
                    {l.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
