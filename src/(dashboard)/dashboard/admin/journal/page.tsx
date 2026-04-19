import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export default async function JournalPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const perPage = 50;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      include: { user: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.auditLog.count(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-anthracite-900 dark:text-stone-100">Journal d&apos;activité</h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">{total} entrée(s)</p>
      </div>

      {logs.length === 0 ? (
        <EmptyState title="Journal vide" description="Les actions des utilisateurs seront enregistrées ici." />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/50 dark:border-anthracite-800 dark:bg-anthracite-800/30">
                  <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Utilisateur</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Action</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Entité</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Détails</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-anthracite-800">
                {logs.map((log) => (
                  <tr key={log.id} className="transition-colors hover:bg-stone-50 dark:hover:bg-anthracite-800/40">
                    <td className="px-4 py-3 text-stone-400 dark:text-stone-500">{formatDateTime(log.createdAt)}</td>
                    <td className="px-4 py-3 text-anthracite-800 dark:text-stone-200">
                      {log.user ? `${log.user.firstName} ${log.user.lastName}` : "Système"}
                    </td>
                    <td className="px-4 py-3 font-medium text-anthracite-800 dark:text-stone-100">{log.action}</td>
                    <td className="px-4 py-3 text-stone-600 dark:text-stone-300">
                      {log.entity} {log.entityId && <span className="font-mono text-xs">#{log.entityId.slice(0, 8)}</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-500 max-w-xs truncate dark:text-stone-400">
                      {log.details || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
