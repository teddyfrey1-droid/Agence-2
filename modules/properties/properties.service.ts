import { generateReference } from "@/lib/utils";
import {
  createProperty,
  updateProperty,
  findPropertyById,
} from "./properties.repository";
import type { CreatePropertyInput, UpdatePropertyInput } from "./properties.schema";

export async function createNewProperty(
  input: CreatePropertyInput,
  assignedToId?: string
) {
  const reference = generateReference("BN");

  const data = {
    ...input,
    reference,
    assignedTo: assignedToId ? { connect: { id: assignedToId } } : undefined,
    owner: input.ownerId ? { connect: { id: input.ownerId } } : undefined,
    ownerId: undefined,
    assignedToId: undefined,
  };

  // Remove undefined keys that prisma doesn't like
  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  );

  return createProperty(cleanData as Parameters<typeof createProperty>[0]);
}

export async function updateExistingProperty(
  id: string,
  input: UpdatePropertyInput
) {
  const property = await findPropertyById(id);
  if (!property) throw new Error("Bien introuvable");

  // Calculate price per sqm if applicable
  let pricePerSqm: number | undefined;
  const surface = input.surfaceTotal ?? property.surfaceTotal;
  const price = input.price ?? property.price;
  if (surface && price) {
    pricePerSqm = Math.round(price / surface);
  }

  return updateProperty(id, { ...input, pricePerSqm });
}

export async function publishProperty(id: string) {
  const property = await findPropertyById(id);
  if (!property) throw new Error("Bien introuvable");

  return updateProperty(id, {
    isPublished: true,
    publishedAt: new Date(),
    status: "ACTIF",
  });
}

export async function unpublishProperty(id: string) {
  return updateProperty(id, {
    isPublished: false,
  });
}
