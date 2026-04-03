"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface PublishButtonProps {
  propertyId: string;
  isPublished: boolean;
}

export function PublishButton({ propertyId, isPublished }: PublishButtonProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    try {
      const res = await fetch(`/api/properties/${propertyId}/publish`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publish: !isPublished }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erreur");
      }
      addToast(
        isPublished ? "Bien dépublié" : "Bien publié avec succès",
        "success"
      );
      router.refresh();
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : "Erreur lors de la publication",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      className="w-full justify-start"
      onClick={handleToggle}
      disabled={loading}
    >
      {loading
        ? isPublished
          ? "Dépublication..."
          : "Publication..."
        : isPublished
          ? "Dépublier"
          : "Publier"}
    </Button>
  );
}
