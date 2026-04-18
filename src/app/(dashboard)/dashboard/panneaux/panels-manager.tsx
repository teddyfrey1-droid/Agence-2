"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Input, Modal, Select } from "@/components/ui";
import { useToast } from "@/components/ui/toast";

type PanelStatus = "DISPONIBLE" | "ACTIF" | "RETIRE";

interface AgentLite {
  firstName: string;
  lastName: string;
  phone?: string | null;
}

interface PropertyLite {
  id: string;
  reference: string;
  title: string;
  status: string;
  assignedTo: AgentLite | null;
}

export interface PanelRow {
  id: string;
  code: string;
  label: string | null;
  status: PanelStatus;
  notes: string | null;
  propertyId: string | null;
  property: PropertyLite | null;
  agentOverride: { firstName: string; lastName: string } | null;
  scanCount: number;
  assignmentCount: number;
  updatedAt: string;
}

interface Props {
  panels: PanelRow[];
  properties: PropertyLite[];
}

const STATUS_VARIANT: Record<PanelStatus, "success" | "neutral" | "danger"> = {
  ACTIF: "success",
  DISPONIBLE: "neutral",
  RETIRE: "danger",
};

const STATUS_LABEL: Record<PanelStatus, string> = {
  ACTIF: "Actif",
  DISPONIBLE: "Disponible",
  RETIRE: "Retiré",
};

export function PanelsManager({ panels, properties }: Props) {
  const router = useRouter();
  const { addToast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | PanelStatus>("ALL");
  const [createOpen, setCreateOpen] = useState(false);
  const [assignFor, setAssignFor] = useState<PanelRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return panels.filter((p) => {
      if (statusFilter !== "ALL" && p.status !== statusFilter) return false;
      if (!needle) return true;
      return (
        p.code.toLowerCase().includes(needle) ||
        (p.label ?? "").toLowerCase().includes(needle) ||
        (p.property?.reference ?? "").toLowerCase().includes(needle) ||
        (p.property?.title ?? "").toLowerCase().includes(needle)
      );
    });
  }, [panels, search, statusFilter]);

  const refresh = () => startTransition(() => router.refresh());

  async function handleCreate(data: { code?: string; label?: string; propertyId?: string }) {
    const res = await fetch("/api/panels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: data.code || undefined,
        label: data.label || undefined,
        propertyId: data.propertyId || undefined,
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      addToast(body.error ?? "Création impossible", "error");
      return false;
    }
    addToast("Panneau créé", "success");
    setCreateOpen(false);
    refresh();
    return true;
  }

  async function handleAssign(panelId: string, propertyId: string | null, reason?: string) {
    setBusyId(panelId);
    try {
      const res = await fetch(`/api/panels/${panelId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, reason }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        addToast(body.error ?? "Réassignation impossible", "error");
        return;
      }
      addToast(propertyId ? "Panneau réassigné" : "Panneau détaché", "success");
      setAssignFor(null);
      refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function handleRetire(panelId: string) {
    if (!confirm("Retirer ce panneau du parc actif ?")) return;
    setBusyId(panelId);
    try {
      const res = await fetch(`/api/panels/${panelId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ retire: true }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        addToast(body.error ?? "Opération impossible", "error");
        return;
      }
      addToast("Panneau retiré", "success");
      refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(panelId: string) {
    if (!confirm("Supprimer définitivement ce panneau ? L'historique sera perdu.")) return;
    setBusyId(panelId);
    try {
      const res = await fetch(`/api/panels/${panelId}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        addToast(body.error ?? "Suppression impossible", "error");
        return;
      }
      addToast("Panneau supprimé", "success");
      refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <Input
              placeholder="Rechercher par code, bien…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            aria-label="Statut"
            options={[
              { value: "ALL", label: "Tous les statuts" },
              { value: "ACTIF", label: "Actifs" },
              { value: "DISPONIBLE", label: "Disponibles" },
              { value: "RETIRE", label: "Retirés" },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "ALL" | PanelStatus)}
          />
        </div>
        <Button onClick={() => setCreateOpen(true)}>+ Nouveau panneau</Button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatChip label="Total" value={panels.length} />
        <StatChip label="Actifs" value={panels.filter((p) => p.status === "ACTIF").length} tone="success" />
        <StatChip label="Disponibles" value={panels.filter((p) => p.status === "DISPONIBLE").length} />
        <StatChip label="Scans cumulés" value={panels.reduce((s, p) => s + p.scanCount, 0)} tone="info" />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 p-10 text-center text-sm text-stone-500 dark:border-stone-700">
          Aucun panneau ne correspond à vos filtres.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-anthracite-900">
          <ul className="divide-y divide-stone-100 dark:divide-stone-800">
            {filtered.map((panel) => (
              <li key={panel.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-anthracite-900 dark:text-stone-100">
                      {panel.code}
                    </span>
                    <Badge variant={STATUS_VARIANT[panel.status]}>{STATUS_LABEL[panel.status]}</Badge>
                    {panel.label && (
                      <span className="text-xs text-stone-500 dark:text-stone-400">{panel.label}</span>
                    )}
                  </div>
                  <div className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                    {panel.property ? (
                      <span>
                        <span className="font-medium text-anthracite-800 dark:text-stone-200">
                          {panel.property.reference}
                        </span>{" "}
                        — {panel.property.title}
                        {panel.property.assignedTo && (
                          <span className="ml-2 text-xs text-stone-500">
                            · Agent : {panel.property.assignedTo.firstName} {panel.property.assignedTo.lastName}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="italic text-stone-400">Non assigné à un bien</span>
                    )}
                  </div>
                  <div className="mt-1 text-[11px] text-stone-400 dark:text-stone-500">
                    {panel.scanCount} scan{panel.scanCount > 1 ? "s" : ""} · {panel.assignmentCount} affectation{panel.assignmentCount > 1 ? "s" : ""}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={`/api/panels/${panel.id}/pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-premium border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-anthracite-800 hover:bg-stone-50 dark:border-stone-600 dark:bg-anthracite-800 dark:text-stone-200 dark:hover:bg-anthracite-700"
                  >
                    PDF
                  </a>
                  {panel.status !== "RETIRE" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setAssignFor(panel)}
                      disabled={busyId === panel.id}
                    >
                      Réassigner
                    </Button>
                  )}
                  {panel.status !== "RETIRE" ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRetire(panel.id)}
                      disabled={busyId === panel.id}
                    >
                      Retirer
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(panel.id)}
                      disabled={busyId === panel.id}
                    >
                      Supprimer
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isPending && (
        <p className="text-center text-xs text-stone-400">Actualisation…</p>
      )}

      <CreatePanelModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        properties={properties}
        onSubmit={handleCreate}
      />

      <AssignPanelModal
        panel={assignFor}
        properties={properties}
        onClose={() => setAssignFor(null)}
        onSubmit={handleAssign}
        busy={busyId === assignFor?.id}
      />
    </div>
  );
}

function StatChip({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "success" | "info";
}) {
  const toneClass =
    tone === "success"
      ? "text-emerald-700 dark:text-emerald-400"
      : tone === "info"
      ? "text-blue-700 dark:text-blue-400"
      : "text-anthracite-900 dark:text-stone-100";
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-anthracite-900">
      <p className="text-[11px] uppercase tracking-wide text-stone-500">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}

function CreatePanelModal({
  open,
  onClose,
  properties,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  properties: PropertyLite[];
  onSubmit: (data: { code?: string; label?: string; propertyId?: string }) => Promise<boolean>;
}) {
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleClose() {
    if (submitting) return;
    setCode("");
    setLabel("");
    setPropertyId("");
    onClose();
  }

  async function submit() {
    setSubmitting(true);
    const ok = await onSubmit({ code: code.trim(), label: label.trim(), propertyId });
    setSubmitting(false);
    if (ok) {
      setCode("");
      setLabel("");
      setPropertyId("");
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Nouveau panneau" size="md">
      <div className="space-y-4">
        <Input
          label="Code (optionnel)"
          placeholder="Laisser vide pour générer PAN-0001"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <Input
          label="Libellé (optionnel)"
          placeholder="ex. Panneau grand format — stock"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <Select
          label="Assigner à un bien (optionnel)"
          placeholder="— Aucun pour l'instant —"
          options={properties.map((p) => ({
            value: p.id,
            label: `${p.reference} — ${p.title}`,
          }))}
          value={propertyId}
          onChange={(e) => setPropertyId(e.target.value)}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={handleClose} disabled={submitting}>
            Annuler
          </Button>
          <Button onClick={submit} isLoading={submitting}>
            Créer
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function AssignPanelModal({
  panel,
  properties,
  onClose,
  onSubmit,
  busy,
}: {
  panel: PanelRow | null;
  properties: PropertyLite[];
  onClose: () => void;
  onSubmit: (panelId: string, propertyId: string | null, reason?: string) => Promise<void>;
  busy: boolean;
}) {
  const [propertyId, setPropertyId] = useState("");
  const [reason, setReason] = useState("");

  if (!panel) return null;

  const currentLabel = panel.property
    ? `${panel.property.reference} — ${panel.property.title}`
    : "Non assigné";

  return (
    <Modal open={!!panel} onClose={onClose} title={`Réassigner ${panel.code}`} size="md">
      <div className="space-y-4">
        <div className="rounded-lg bg-stone-50 p-3 text-sm dark:bg-anthracite-800">
          <p className="text-xs uppercase tracking-wide text-stone-500">Affectation actuelle</p>
          <p className="mt-1 font-medium text-anthracite-800 dark:text-stone-200">{currentLabel}</p>
        </div>

        <Select
          label="Nouveau bien"
          placeholder="— Détacher (aucun bien) —"
          options={properties
            .filter((p) => p.id !== panel.propertyId)
            .map((p) => ({
              value: p.id,
              label: `${p.reference} — ${p.title}`,
            }))}
          value={propertyId}
          onChange={(e) => setPropertyId(e.target.value)}
        />

        <Input
          label="Raison (optionnel)"
          placeholder="ex. Bien vendu, panneau réutilisé"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        <p className="text-xs text-stone-500">
          Le QR imprimé reste identique — seule la cible change. Les scans déclencheront une
          discussion WhatsApp avec l'agent du nouveau bien.
        </p>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Annuler
          </Button>
          <Button
            onClick={() => onSubmit(panel.id, propertyId || null, reason.trim() || undefined)}
            isLoading={busy}
          >
            {propertyId ? "Réassigner" : "Détacher"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
