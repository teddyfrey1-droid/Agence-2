import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { CONTACT_TYPE_LABELS } from "@/lib/constants";
import { formatDateShort } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Contacts dormants" };

const DORMANT_DAYS = 60;

function daysSince(d: Date): number {
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

export default async function DormantsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const params = await searchParams;
  const range = parseInt(params.range || String(DORMANT_DAYS), 10);
  const cutoff = new Date(Date.now() - range * 24 * 60 * 60 * 1000);

  const contacts = await prisma.contact.findMany({
    where: {
      isActive: true,
      OR: [
        { interactions: { none: {} } },
        { NOT: { interactions: { some: { date: { gte: cutoff } } } } },
      ],
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      company: true,
      email: true,
      phone: true,
      mobile: true,
      type: true,
      createdAt: true,
      updatedAt: true,
      interactions: {
        orderBy: { date: "desc" },
        take: 1,
        select: { date: true, type: true, subject: true },
      },
      _count: {
        select: { searchRequests: true, deals: true, interactions: true },
      },
    },
    orderBy: { updatedAt: "asc" },
    take: 200,
  });

  const neverContacted = contacts.filter((c) => c.interactions.length === 0);
  const stale = contacts.filter((c) => c.interactions.length > 0);

  const presetRanges = [30, 60, 90, 180];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-stone-400 dark:text-stone-500">
            Relances
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-anthracite-900 dark:text-stone-100">
            Contacts dormants
          </h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            Contacts sans interaction depuis plus de {range} jours — relancez-les pour
            réactiver le lien.
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white p-1 dark:border-anthracite-800 dark:bg-anthracite-900">
          {presetRanges.map((d) => (
            <Link
              key={d}
              href={`/dashboard/contacts/dormants?range=${d}`}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                d === range
                  ? "bg-brand-600 text-white"
                  : "text-stone-500 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-anthracite-800"
              }`}
            >
              +{d}j
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <MiniStat label="Total dormants" value={contacts.length} />
        <MiniStat label="Jamais contactés" value={neverContacted.length} />
        <MiniStat label="Inactifs" value={stale.length} />
      </div>

      {contacts.length === 0 ? (
        <EmptyState
          title="Aucun contact dormant"
          description="Tous vos contacts actifs ont été suivis récemment — continuez sur cette lancée !"
        />
      ) : (
        <div className="space-y-2">
          {contacts.map((c) => {
            const fullName = [c.firstName, c.lastName].filter(Boolean).join(" ").trim() || c.company || "—";
            const last = c.interactions[0];
            const days = last ? daysSince(new Date(last.date)) : daysSince(new Date(c.createdAt));
            const severity =
              days >= 180 ? "high" : days >= 90 ? "medium" : "low";
            const severityColor =
              severity === "high"
                ? "bg-rose-500"
                : severity === "medium"
                  ? "bg-amber-500"
                  : "bg-stone-400";
            const phone = c.phone || c.mobile;
            return (
              <Card key={c.id} className="p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-stone-100 text-sm font-bold text-stone-600 dark:bg-anthracite-800 dark:text-stone-300">
                      {(c.firstName?.[0] || "") + (c.lastName?.[0] || "") || "?"}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/contacts/${c.id}`}
                          className="truncate text-sm font-semibold text-anthracite-900 hover:text-brand-700 dark:text-stone-100 dark:hover:text-brand-400"
                        >
                          {fullName}
                        </Link>
                        <Badge variant="neutral">
                          {CONTACT_TYPE_LABELS[c.type] || c.type}
                        </Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-stone-500 dark:text-stone-400">
                        {c.company && <span>{c.company}</span>}
                        {c.email && <span>{c.email}</span>}
                        {phone && <span>{phone}</span>}
                      </div>
                      <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                        {last ? (
                          <>
                            Dernière interaction : {formatDateShort(new Date(last.date))}
                            {last.subject ? ` — ${last.subject}` : ""}
                          </>
                        ) : (
                          <>Aucune interaction enregistrée</>
                        )}
                        {" · "}
                        <span className="font-medium text-anthracite-700 dark:text-stone-300">
                          {days} jours
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium text-white ${severityColor}`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
                      {severity === "high" ? "Urgent" : severity === "medium" ? "À relancer" : "Tiède"}
                    </span>
                    {c.email && (
                      <a href={`mailto:${c.email}`}>
                        <Button variant="outline" size="sm">
                          <svg
                            className="mr-1.5 h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M21 8.25v10.5A2.25 2.25 0 0118.75 21H5.25A2.25 2.25 0 013 18.75V8.25m18 0A2.25 2.25 0 0018.75 6H5.25A2.25 2.25 0 003 8.25m18 0l-9 6-9-6"
                            />
                          </svg>
                          Email
                        </Button>
                      </a>
                    )}
                    {phone && (
                      <a href={`tel:${phone}`}>
                        <Button variant="outline" size="sm">
                          <svg
                            className="mr-1.5 h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11 11 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                          </svg>
                          Appeler
                        </Button>
                      </a>
                    )}
                    <Link href={`/dashboard/contacts/${c.id}`}>
                      <Button size="sm">Fiche</Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-stone-200/80 bg-white p-4 dark:border-anthracite-800 dark:bg-anthracite-900">
      <p className="text-[11px] uppercase tracking-widest text-stone-500 dark:text-stone-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-anthracite-900 dark:text-stone-100">{value}</p>
    </div>
  );
}
