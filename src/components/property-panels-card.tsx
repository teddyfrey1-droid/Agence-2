"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

export interface AttachedPanel {
  id: string;
  code: string;
  label: string | null;
  scanCount: number;
}

export interface AvailablePanel {
  id: string;
  code: string;
  label: string | null;
}

interface Props {
  propertyId: string;
  attached: AttachedPanel[];
  available: AvailablePanel[];
}

export function PropertyPanelsCard({ propertyId, attached, available }: Props) {
  const router = useRouter();
  const { addToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<"attach" | "create">(
    available.length > 0 ? "attach" : "create"
  );
  const [pickedId, setPickedId] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const refresh = () => startTransition(() => router.refresh());

  async function submit() {
    setSubmitting(true);
    try {
      if (mode === "attach") {
        if (!pickedId) {
          addToast("Sélectionnez un panneau", "error");
          return;
        }
        const res = await fetch(`/api/panels/${pickedId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ propertyId, reason: "Affecté depuis la fiche bien" }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          addToast(body.error ?? "Échec", "error");
          return;
        }
        addToast("Panneau affecté", "success");
      } else {
        const res = await fetch("/api/panels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            propertyId,
            label: newLabel.trim() || undefined,
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          addToast(body.error ?? "Échec de création", "error");
          return;
        }
        addToast("Panneau créé et affecté", "success");
      }
      setModalOpen(false);
      setPickedId("");
      setNewLabel("");
      refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function detach(panelId: string) {
    if (!confirm("Détacher ce panneau du bien ? Il redeviendra disponible.")) return;
    const res = await fetch(`/api/panels/${panelId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId: null, reason: "Détaché depuis la fiche bien" }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      addToast(body.error ?? "Échec", "error");
      return;
    }
    addToast("Panneau détaché", "success");
    refresh();
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="heading-card">Panneaux QR</h2>
            <Button size="sm" variant="outline" onClick={() => setModalOpen(true)}>
              + Affecter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {attached.length === 0 ? (
            <p className="text-sm text-stone-400">Aucun panneau affecté.</p>
          ) : (
            <ul className="space-y-2">
              {attached.map((panel) => (
                <li
                  key={panel.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-stone-100 p-2 dark:border-stone-800"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-anthracite-900 dark:text-stone-100">
                        {panel.code}
                      </span>
                      <Badge variant="success">Actif</Badge>
                    </div>
                    {panel.label && (
                      <p className="truncate text-xs text-stone-500">{panel.label}</p>
                    )}
                    <p className="text-[11px] text-stone-400">
                      {panel.scanCount} scan{panel.scanCount > 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <a
                      href={`/api/panels/${panel.id}/pdf`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-stone-200 px-2 py-1 text-xs text-anthracite-700 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-anthracite-800"
                    >
                      PDF
                    </a>
                    <button
                      onClick={() => detach(panel.id)}
                      className="rounded-lg px-2 py-1 text-xs text-stone-500 hover:bg-stone-100 hover:text-red-600 dark:hover:bg-anthracite-800"
                    >
                      Détacher
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/dashboard/panneaux"
            className="mt-3 block text-xs text-brand-600 hover:underline"
          >
            Gérer tous les panneaux →
          </Link>
        </CardContent>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => !submitting && setModalOpen(false)}
        title="Affecter un panneau"
        size="md"
      >
        <div className="space-y-4">
          {available.length > 0 && (
            <div className="flex gap-2 rounded-lg bg-stone-50 p-1 text-sm dark:bg-anthracite-800">
              <button
                className={`flex-1 rounded-md px-3 py-1.5 font-medium transition-colors ${
                  mode === "attach"
                    ? "bg-white text-anthracite-900 shadow-sm dark:bg-anthracite-700 dark:text-stone-100"
                    : "text-stone-500"
                }`}
                onClick={() => setMode("attach")}
              >
                Réutiliser un panneau
              </button>
              <button
                className={`flex-1 rounded-md px-3 py-1.5 font-medium transition-colors ${
                  mode === "create"
                    ? "bg-white text-anthracite-900 shadow-sm dark:bg-anthracite-700 dark:text-stone-100"
                    : "text-stone-500"
                }`}
                onClick={() => setMode("create")}
              >
                Nouveau panneau
              </button>
            </div>
          )}

          {mode === "attach" ? (
            <Select
              label="Panneau disponible"
              placeholder="Sélectionner…"
              options={available.map((p) => ({
                value: p.id,
                label: p.label ? `${p.code} — ${p.label}` : p.code,
              }))}
              value={pickedId}
              onChange={(e) => setPickedId(e.target.value)}
            />
          ) : (
            <Input
              label="Libellé (optionnel)"
              placeholder="ex. Grand format — vitrine"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
            />
          )}

          <p className="text-xs text-stone-500">
            Le QR code redirige chaque scan vers WhatsApp de l'agent assigné avec la
            référence du bien pré-remplie.
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={submitting}>
              Annuler
            </Button>
            <Button onClick={submit} isLoading={submitting}>
              {mode === "attach" ? "Affecter" : "Créer et affecter"}
            </Button>
          </div>
        </div>
      </Modal>

      {isPending && (
        <p className="text-center text-[10px] text-stone-400">Actualisation…</p>
      )}
    </>
  );
}
