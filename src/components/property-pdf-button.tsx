"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { generatePropertyFichePdf } from "@/lib/property-pdf";

export function PropertyPdfButton({ propertyId }: { propertyId: string }) {
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  async function generatePdf() {
    setLoading(true);
    try {
      await generatePropertyFichePdf(propertyId);
      addToast("Fiche PDF générée.", "success");
    } catch (err) {
      console.error("PDF generation error:", err);
      addToast(
        err instanceof Error ? err.message : "Erreur lors de la génération du PDF.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" className="w-full justify-start" onClick={generatePdf} disabled={loading}>
      <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
      {loading ? "Génération..." : "Fiche PDF Commerciale"}
    </Button>
  );
}
