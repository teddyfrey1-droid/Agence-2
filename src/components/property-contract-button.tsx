"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PropertyContractModal } from "@/components/property-contract-modal";

export function PropertyContractButton({ propertyId }: { propertyId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" className="w-full justify-start" onClick={() => setOpen(true)}>
        <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        Contrat d&apos;engagement
      </Button>
      {open && <PropertyContractModal propertyId={propertyId} onClose={() => setOpen(false)} />}
    </>
  );
}
