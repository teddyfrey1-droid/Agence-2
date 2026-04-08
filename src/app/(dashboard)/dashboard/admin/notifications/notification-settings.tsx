"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";

const USER_ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  DIRIGEANT: "Dirigeant",
  ASSOCIE: "Associé",
  MANAGER: "Manager",
  AGENT: "Agent",
  ASSISTANT: "Assistant",
  CLIENT: "Client",
};

const COLLABORATEUR_ROLES = ["SUPER_ADMIN", "DIRIGEANT", "ASSOCIE", "MANAGER", "AGENT", "ASSISTANT"];

interface NotificationSetting {
  id: string;
  eventType: string;
  category: string;
  pushEnabled: boolean;
  emailEnabled: boolean;
  targetRoles: string[];
  label: string;
  description: string | null;
  followUpDelayDays: number;
}

function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  return (
    <div className={`fixed bottom-6 right-6 z-[60] flex items-center gap-3 rounded-xl px-5 py-3 shadow-lg animate-fade-in ${
      type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
    }`}>
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="text-white/70 hover:text-white">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

function ToggleSwitch({ enabled, onChange, label }: { enabled: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className="flex items-center gap-2 group"
      title={label}
    >
      <div className={`relative h-5 w-9 rounded-full transition-colors ${enabled ? "bg-brand-600" : "bg-stone-300 dark:bg-stone-600"}`}>
        <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${enabled ? "translate-x-4" : "translate-x-0.5"}`} />
      </div>
      <span className="text-xs text-stone-500 group-hover:text-stone-700 dark:text-stone-400">{label}</span>
    </button>
  );
}

function RoleSelector({ selectedRoles, onChange }: { selectedRoles: string[]; onChange: (roles: string[]) => void }) {
  const allSelected = selectedRoles.length === 0;

  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        onClick={() => onChange([])}
        className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
          allSelected
            ? "bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
            : "bg-stone-100 text-stone-500 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-400"
        }`}
      >
        Tous
      </button>
      {COLLABORATEUR_ROLES.map((role) => {
        const isSelected = selectedRoles.includes(role);
        return (
          <button
            key={role}
            onClick={() => {
              if (isSelected) {
                const next = selectedRoles.filter((r) => r !== role);
                onChange(next);
              } else {
                onChange([...selectedRoles, role]);
              }
            }}
            className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
              isSelected
                ? "bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                : "bg-stone-100 text-stone-500 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-400"
            }`}
          >
            {USER_ROLE_LABELS[role]}
          </button>
        );
      })}
    </div>
  );
}

function SettingRow({
  setting,
  onChange,
  showRoles,
  showFollowUp,
}: {
  setting: NotificationSetting;
  onChange: (updated: NotificationSetting) => void;
  showRoles: boolean;
  showFollowUp: boolean;
}) {
  return (
    <div className="border-b border-stone-100 dark:border-stone-800 last:border-0 px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium text-anthracite-800 dark:text-stone-200">{setting.label}</h4>
            <Badge variant="neutral">{setting.eventType}</Badge>
          </div>
          {setting.description && (
            <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">{setting.description}</p>
          )}
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          <ToggleSwitch
            enabled={setting.pushEnabled}
            onChange={(v) => onChange({ ...setting, pushEnabled: v })}
            label="Push"
          />
          <ToggleSwitch
            enabled={setting.emailEnabled}
            onChange={(v) => onChange({ ...setting, emailEnabled: v })}
            label="Email"
          />
        </div>
      </div>

      {showRoles && (
        <div className="mt-3">
          <p className="text-[11px] font-medium text-stone-400 dark:text-stone-500 mb-1.5 uppercase tracking-wide">Rôles ciblés</p>
          <RoleSelector
            selectedRoles={setting.targetRoles}
            onChange={(roles) => onChange({ ...setting, targetRoles: roles })}
          />
        </div>
      )}

      {showFollowUp && setting.followUpDelayDays !== undefined && (
        <div className="mt-3 flex items-center gap-3">
          <p className="text-[11px] font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wide">Délai de relance</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              max="365"
              value={setting.followUpDelayDays}
              onChange={(e) => onChange({ ...setting, followUpDelayDays: parseInt(e.target.value) || 0 })}
              className="w-20 rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-sm text-anthracite-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-stone-600 dark:bg-anthracite-800 dark:text-stone-200"
            />
            <span className="text-xs text-stone-500">jours</span>
            {setting.followUpDelayDays === 0 && (
              <Badge variant="neutral">Désactivé</Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function NotificationSettingsManager() {
  const [settings, setSettings] = useState<NotificationSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notification-settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch {
      showToast("Erreur de chargement", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleChange = (updated: NotificationSetting) => {
    setSettings((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/notification-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: settings.map((s) => ({
            id: s.id,
            pushEnabled: s.pushEnabled,
            emailEnabled: s.emailEnabled,
            targetRoles: s.targetRoles,
            followUpDelayDays: s.followUpDelayDays,
          })),
        }),
      });
      if (res.ok) {
        showToast("Paramètres sauvegardés");
        setHasChanges(false);
      } else {
        showToast("Erreur lors de la sauvegarde", "error");
      }
    } catch {
      showToast("Erreur réseau", "error");
    } finally {
      setSaving(false);
    }
  };

  const collabSettings = settings.filter((s) => s.category === "COLLABORATEUR");
  const clientSettings = settings.filter((s) => s.category === "CLIENT");

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-anthracite-900 dark:text-stone-100">Notifications</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">Chargement...</p>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-stone-100 dark:bg-anthracite-800" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-anthracite-900 dark:text-stone-100">Notifications & Emails</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Configurez précisément quand envoyer des notifications push ou des emails, selon les événements et les rôles.
          </p>
        </div>
        {hasChanges && (
          <Button onClick={handleSave} isLoading={saving}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Sauvegarder
          </Button>
        )}
      </div>

      {/* Info banner */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-900/20">
        <div className="flex items-start gap-3">
          <svg className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <p className="font-medium">Comment ça fonctionne</p>
            <p className="mt-1 text-blue-600 dark:text-blue-400">
              <strong>Push</strong> = notification instantanée dans l&apos;application.{" "}
              <strong>Email</strong> = email envoyé via Brevo.{" "}
              Les <strong>rôles ciblés</strong> permettent de limiter qui reçoit la notification.{" "}
              Le <strong>délai de relance</strong> (côté client) permet de programmer des emails automatiques après X jours.
            </p>
          </div>
        </div>
      </div>

      <Tabs
        tabs={[
          { id: "collaborateur", label: "Collaborateurs", count: collabSettings.length },
          { id: "client", label: "Clients", count: clientSettings.length },
        ]}
      >
        {(activeTab) => (
          <>
            {activeTab === "collaborateur" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-stone-600 dark:text-stone-400">
                    Choisissez pour chaque événement si les collaborateurs reçoivent une notification push, un email, ou les deux.
                    Ciblez par rôle pour un contrôle fin.
                  </p>
                </div>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <h2 className="heading-card">Événements collaborateurs</h2>
                      <div className="flex items-center gap-4 text-[11px] font-medium text-stone-400 uppercase tracking-wide">
                        <span className="w-16 text-center">Push</span>
                        <span className="w-16 text-center">Email</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {collabSettings.map((s) => (
                      <SettingRow
                        key={s.id}
                        setting={s}
                        onChange={handleChange}
                        showRoles
                        showFollowUp={false}
                      />
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "client" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-stone-600 dark:text-stone-400">
                    Paramétrez les emails envoyés aux clients : biens correspondants, propositions, relances automatiques.
                    Le délai de relance (en jours) programme des emails automatiques.
                  </p>
                </div>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <h2 className="heading-card">Événements clients</h2>
                      <div className="flex items-center gap-4 text-[11px] font-medium text-stone-400 uppercase tracking-wide">
                        <span className="w-16 text-center">Push</span>
                        <span className="w-16 text-center">Email</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {clientSettings.map((s) => (
                      <SettingRow
                        key={s.id}
                        setting={s}
                        onChange={handleChange}
                        showRoles={false}
                        showFollowUp
                      />
                    ))}
                  </CardContent>
                </Card>

                {/* Follow-up summary */}
                <Card>
                  <CardHeader>
                    <h2 className="heading-card">Récapitulatif des relances automatiques</h2>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {clientSettings.filter((s) => s.followUpDelayDays > 0).length === 0 ? (
                        <p className="text-sm text-stone-400 dark:text-stone-500">Aucune relance automatique configurée.</p>
                      ) : (
                        clientSettings.filter((s) => s.followUpDelayDays > 0).map((s) => (
                          <div key={s.id} className="flex items-center justify-between rounded-lg bg-stone-50 dark:bg-anthracite-800/50 px-4 py-3">
                            <div>
                              <p className="text-sm font-medium text-anthracite-800 dark:text-stone-200">{s.label}</p>
                              <p className="text-xs text-stone-500 dark:text-stone-400">{s.description}</p>
                            </div>
                            <Badge variant="info">
                              Tous les {s.followUpDelayDays} jours
                            </Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </Tabs>

      {/* Sticky save bar */}
      {hasChanges && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-stone-200 bg-white/90 backdrop-blur-sm px-6 py-3 dark:border-stone-700 dark:bg-anthracite-900/90">
          <div className="mx-auto flex max-w-5xl items-center justify-between">
            <p className="text-sm text-stone-600 dark:text-stone-400">Vous avez des modifications non sauvegardées.</p>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => { fetchSettings(); setHasChanges(false); }}>Annuler</Button>
              <Button onClick={handleSave} isLoading={saving}>Sauvegarder</Button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
