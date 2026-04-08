"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PropertyShareModal } from "./property-share-modal";

export function PropertyShareButton({ propertyId }: { propertyId: string }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        className="w-full justify-start"
        onClick={() => setShowModal(true)}
      >
        <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
        </svg>
        Envoyer à un client
      </Button>
      {showModal && (
        <PropertyShareModal
          propertyId={propertyId}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
