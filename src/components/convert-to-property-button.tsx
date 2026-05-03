"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Confetti } from "@/components/confetti";
import { unlockAchievement } from "@/lib/achievements";

interface ConvertToPropertyButtonProps {
  spotId: string;
  address: string;
  city: string;
  zipCode: string | null;
  district: string | null;
  propertyType: string | null;
  transactionType?: string | null;
  surface: number | null;
  facadeLength?: number | null;
  ceilingHeight?: number | null;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
}

export function ConvertToPropertyButton({
  spotId,
  address,
  city,
  zipCode,
  district,
  propertyType,
  transactionType,
  surface,
  facadeLength,
  ceilingHeight,
  latitude,
  longitude,
  notes,
}: ConvertToPropertyButtonProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  async function handleConvert() {
    setLoading(true);
    try {
      // Create property from spotting data
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: address,
          type: propertyType || "LOCAL_COMMERCIAL",
          transactionType: transactionType || "LOCATION",
          address,
          city,
          zipCode: zipCode || undefined,
          district: district || undefined,
          surfaceTotal: surface || undefined,
          facadeLength: facadeLength || undefined,
          ceilingHeight: ceilingHeight || undefined,
          latitude: latitude || undefined,
          longitude: longitude || undefined,
          description: notes || undefined,
        }),
      });

      if (!res.ok) throw new Error("Erreur lors de la création du bien");
      const property = await res.json();

      // Update spotting status to CONVERTI and link to property
      await fetch(`/api/field-spotting/${spotId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CONVERTI" }),
      });

      addToast("Repérage converti en bien", "success");
      setCelebrate(true);
      unlockAchievement("first_conversion");
      setTimeout(() => router.push(`/dashboard/biens/${property.id}/modifier`), 1500);
    } catch {
      addToast("Erreur lors de la conversion", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Confetti fire={celebrate} onDone={() => setCelebrate(false)} />
      <Button
        variant="primary"
        className="w-full"
        onClick={handleConvert}
        disabled={loading}
      >
        <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
        {loading ? "Conversion..." : "Convertir en bien"}
      </Button>
    </>
  );
}
