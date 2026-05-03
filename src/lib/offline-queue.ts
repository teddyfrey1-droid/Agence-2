/**
 * Tiny IndexedDB-backed queue for field-spotting capture, used when the
 * agent is on the move and the network drops. A queued capture is
 * automatically replayed by `OfflineSync` when the browser reports `online`.
 *
 * Uses raw IndexedDB to avoid any extra dependency.
 */

const DB_NAME = "retail-offline";
const DB_VERSION = 1;
const STORE = "spots";

export interface QueuedSpot {
  id: string; // local uuid
  payload: {
    address: string;
    city?: string;
    zipCode?: string | null;
    district?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    notes?: string;
    surface?: number;
    facadeLength?: number;
    ceilingHeight?: number;
    transactionType?: "VENTE" | "LOCATION" | "CESSION_BAIL" | "FOND_DE_COMMERCE";
    propertyType?:
      | "BOUTIQUE"
      | "BUREAU"
      | "LOCAL_COMMERCIAL"
      | "LOCAL_ACTIVITE"
      | "RESTAURANT"
      | "HOTEL"
      | "ENTREPOT"
      | "PARKING"
      | "TERRAIN"
      | "IMMEUBLE"
      | "AUTRE";
  };
  photos: Blob[]; // raw image blobs to upload after the spotting is created
  createdAt: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("IndexedDB indisponible"));
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function queueSpot(spot: QueuedSpot): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(spot);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function listQueued(): Promise<QueuedSpot[]> {
  try {
    const db = await openDb();
    const items: QueuedSpot[] = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => resolve((req.result as QueuedSpot[]) || []);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return items;
  } catch {
    return [];
  }
}

export async function removeQueued(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function countQueued(): Promise<number> {
  return (await listQueued()).length;
}

/**
 * Try to flush the queue. Returns the number of successfully synced items.
 * Each entry creates a FieldSpotting then uploads its photos.
 */
export async function flushQueue(): Promise<number> {
  const items = await listQueued();
  let synced = 0;
  for (const item of items) {
    try {
      const res = await fetch("/api/field-spotting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.payload),
      });
      if (!res.ok) continue;
      const spot = await res.json();
      // Best-effort: upload each queued photo, ignore individual failures
      for (const blob of item.photos) {
        const fd = new FormData();
        fd.append("file", new File([blob], "offline.jpg", { type: blob.type || "image/jpeg" }));
        fd.append("entityType", "fieldSpotting");
        fd.append("entityId", spot.id);
        await fetch("/api/upload", { method: "POST", body: fd }).catch(() => {});
      }
      await removeQueued(item.id);
      synced++;
    } catch {
      // network is still flaky — leave for next pass
    }
  }
  return synced;
}
