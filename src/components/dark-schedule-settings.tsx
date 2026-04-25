"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { DEFAULT_SCHEDULE, getSchedule, saveSchedule } from "@/components/scheduled-dark-mode";

const inputClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-anthracite-800 placeholder:text-stone-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors dark:border-stone-700 dark:bg-anthracite-900 dark:text-stone-200";

export function DarkScheduleSettings() {
  const { addToast } = useToast();
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSchedule(getSchedule());
  }, []);

  function update<K extends keyof typeof schedule>(key: K, value: (typeof schedule)[K]) {
    setSchedule((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function persist() {
    saveSchedule(schedule);
    setSaved(true);
    addToast(
      schedule.enabled
        ? `Sombre actif de ${schedule.darkFrom} à ${schedule.darkUntil}`
        : "Bascule horaire désactivée",
      "success"
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-stone-100 bg-stone-50/50 px-6 py-4 dark:border-anthracite-800 dark:bg-anthracite-900/50">
        <h2 className="font-semibold text-anthracite-900 dark:text-stone-100">Bascule sombre automatique</h2>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          Active le mode sombre selon une plage horaire — utile en visite tardive ou en réunion du matin.
        </p>
      </div>
      <div className="space-y-4 px-6 py-4">
        <label className="flex items-start gap-3 rounded-xl border border-stone-200 bg-stone-50/50 p-3 dark:border-stone-700 dark:bg-anthracite-900/50">
          <input
            type="checkbox"
            checked={schedule.enabled}
            onChange={(e) => update("enabled", e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-stone-400 text-brand-600 focus:ring-brand-500"
          />
          <span>
            <span className="block text-sm font-medium text-anthracite-800 dark:text-stone-200">
              Activer la bascule horaire
            </span>
            <span className="block text-xs text-stone-500 dark:text-stone-400">
              Prend la main sur le réglage clair / sombre pendant la plage choisie.
            </span>
          </span>
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-stone-500 dark:text-stone-400">
              Passer en sombre à
            </label>
            <input
              type="time"
              value={schedule.darkFrom}
              onChange={(e) => update("darkFrom", e.target.value)}
              className={inputClass}
              disabled={!schedule.enabled}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-stone-500 dark:text-stone-400">
              Repasser en clair à
            </label>
            <input
              type="time"
              value={schedule.darkUntil}
              onChange={(e) => update("darkUntil", e.target.value)}
              className={inputClass}
              disabled={!schedule.enabled}
            />
          </div>
        </div>

        <p className="text-xs text-stone-400 dark:text-stone-500">
          Les fenêtres qui passent minuit (ex. 20:00 → 07:00) sont gérées automatiquement.
        </p>

        <div className="pt-2">
          <Button type="button" onClick={persist}>
            {saved ? "Enregistré" : "Enregistrer"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
