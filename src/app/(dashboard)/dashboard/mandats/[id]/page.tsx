import Link from "next/link";
import { notFound } from "next/navigation";
import { findMandateById } from "@/modules/mandates";
import { formatDateShort } from "@/lib/utils";
import {
  MANDATE_KIND_LABELS,
  MANDATE_STATUS_LABELS,
  MANDATE_FEES_PAYER_LABELS,
} from "@/lib/constants";
import { Badge, getStatusBadgeVariant } from "@/components/ui/badge";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { MandateActions } from "./mandate-actions";

const STATUS_FLOW = ["BROUILLON", "ENVOYE", "SIGNE"] as const;

function daysUntil(date: Date | null): number | null {
  if (!date) return null;
  return Math.ceil((date.getTime() - Date.now()) / 86_400_000);
}

export default async function MandatDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const mandate = await findMandateById(id);
  if (!mandate) notFound();

  const contact = mandate.contact;
  const property = mandate.property;
  const days = daysUntil(mandate.endDate);
  const watched = mandate.status === "SIGNE" || mandate.status === "ENVOYE";
  const flowIndex = STATUS_FLOW.indexOf(mandate.status as (typeof STATUS_FLOW)[number]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/dashboard/mandats"
            className="text-xs text-stone-400 hover:text-anthracite-800 dark:hover:text-stone-200"
          >
            ← Mandats
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-anthracite-900 dark:text-stone-100">
              {MANDATE_KIND_LABELS[mandate.kind] || mandate.kind}
            </h1>
            <Badge variant={getStatusBadgeVariant(mandate.status)}>
              {MANDATE_STATUS_LABELS[mandate.status] || mandate.status}
            </Badge>
          </div>
          <p className="mt-1 font-mono text-xs text-stone-400 dark:text-stone-500">{mandate.reference}</p>
        </div>
      </div>

      {/* Progress rail — brouillon → envoyé → signé */}
      {flowIndex >= 0 && (
        <ol className="flex items-center">
          {STATUS_FLOW.map((step, i) => {
            const done = i < flowIndex;
            const current = i === flowIndex;
            return (
              <li key={step} className={`flex items-center ${i < STATUS_FLOW.length - 1 ? "flex-1" : ""}`}>
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold transition-colors ${
                    current
                      ? "bg-brand-500 text-white dark:text-anthracite-950"
                      : done
                        ? "bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"
                        : "bg-stone-100 text-stone-400 dark:bg-anthracite-800 dark:text-stone-500"
                  }`}
                >
                  {done ? "✓" : i + 1}
                </span>
                <span
                  className={`ml-2 hidden text-xs sm:inline ${
                    current
                      ? "font-semibold text-anthracite-900 dark:text-stone-100"
                      : "text-stone-400 dark:text-stone-500"
                  }`}
                >
                  {MANDATE_STATUS_LABELS[step]}
                </span>
                {i < STATUS_FLOW.length - 1 && (
                  <span
                    className={`mx-3 h-px flex-1 ${done ? "bg-brand-300 dark:bg-brand-700" : "bg-stone-200 dark:bg-anthracite-800"}`}
                  />
                )}
              </li>
            );
          })}
        </ol>
      )}

      {/* Échéance alert */}
      {watched && days !== null && days <= 30 && (
        <div
          className={`rounded-lg border p-4 text-sm ${
            days < 0
              ? "border-red-200 bg-red-50 text-red-700 dark:border-red-800/30 dark:bg-red-900/20 dark:text-red-400"
              : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/30 dark:bg-amber-900/20 dark:text-amber-400"
          }`}
        >
          {days < 0
            ? `Ce mandat est arrivé à échéance le ${formatDateShort(mandate.endDate!)}. Pensez à le renouveler ou à le clôturer.`
            : `Ce mandat expire dans ${days} jour${days > 1 ? "s" : ""} (${formatDateShort(mandate.endDate!)}).`}
        </div>
      )}

      {/* Actions */}
      <MandateActions mandateId={mandate.id} status={mandate.status} propertyId={mandate.propertyId} />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Client */}
        <Card>
          <CardHeader>
            <h2 className="heading-card">Client</h2>
          </CardHeader>
          <CardContent>
            {contact ? (
              <Link href={`/dashboard/contacts/${contact.id}`} className="group block">
                <p className="text-sm font-medium text-anthracite-800 group-hover:text-brand-600 dark:text-stone-200 dark:group-hover:text-brand-400">
                  {contact.firstName} {contact.lastName}
                  {contact.company && <span className="text-stone-500 dark:text-stone-400"> · {contact.company}</span>}
                </p>
                <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                  {[contact.email, contact.phone || contact.mobile].filter(Boolean).join(" · ") || "Coordonnées non renseignées"}
                </p>
              </Link>
            ) : (
              <p className="text-sm text-stone-400">Aucun client lié.</p>
            )}
          </CardContent>
        </Card>

        {/* Bien */}
        <Card>
          <CardHeader>
            <h2 className="heading-card">Bien concerné</h2>
          </CardHeader>
          <CardContent>
            {property ? (
              <Link href={`/dashboard/biens/${property.id}`} className="group flex items-center gap-3">
                {property.media?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={property.media[0].url}
                    alt={property.title}
                    className="h-14 w-20 flex-none rounded-lg object-cover"
                  />
                ) : (
                  <span className="flex h-14 w-20 flex-none items-center justify-center rounded-lg bg-stone-100 text-stone-300 dark:bg-anthracite-800 dark:text-stone-600">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21" />
                    </svg>
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-anthracite-800 group-hover:text-brand-600 dark:text-stone-200 dark:group-hover:text-brand-400">
                    {property.title}
                  </p>
                  <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
                    {[property.reference, property.address, property.district || property.city]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              </Link>
            ) : (
              <p className="text-sm text-stone-400">
                Aucun bien lié — pour un mandat de recherche c&apos;est normal. Liez un bien pour pouvoir
                générer la feuille d&apos;engagement.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Durée */}
        <Card>
          <CardHeader>
            <h2 className="heading-card">Durée</h2>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-stone-500 dark:text-stone-400">Début</dt>
                <dd className="font-medium text-anthracite-800 dark:text-stone-200">
                  {formatDateShort(mandate.startDate)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-500 dark:text-stone-400">Fin / Caducité</dt>
                <dd className="font-medium text-anthracite-800 dark:text-stone-200">
                  {mandate.endDate ? formatDateShort(mandate.endDate) : "—"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-500 dark:text-stone-400">Signé le</dt>
                <dd className="font-medium text-anthracite-800 dark:text-stone-200">
                  {mandate.signedAt ? formatDateShort(mandate.signedAt) : "—"}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Honoraires */}
        <Card>
          <CardHeader>
            <h2 className="heading-card">Honoraires</h2>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-stone-500 dark:text-stone-400">Taux</dt>
                <dd className="font-medium text-anthracite-800 dark:text-stone-200">{mandate.feesPercent || "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-500 dark:text-stone-400">Montant</dt>
                <dd className="font-medium text-anthracite-800 dark:text-stone-200">{mandate.feesAmount || "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-500 dark:text-stone-400">Partie redevable</dt>
                <dd className="font-medium text-anthracite-800 dark:text-stone-200">
                  {mandate.feesPayer ? MANDATE_FEES_PAYER_LABELS[mandate.feesPayer] || mandate.feesPayer : "—"}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {mandate.notes && (
        <Card>
          <CardHeader>
            <h2 className="heading-card">Notes internes</h2>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-600 dark:text-stone-300">
              {mandate.notes}
            </p>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-stone-400 dark:text-stone-500">
        Créé le {formatDateShort(mandate.createdAt)}
        {mandate.createdBy && ` par ${mandate.createdBy.firstName} ${mandate.createdBy.lastName}`} · Dernière mise à
        jour le {formatDateShort(mandate.updatedAt)}
      </p>
    </div>
  );
}
