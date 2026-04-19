import { prisma } from "@/lib/prisma";
import { nextPanelCode } from "./panels.helpers";

/**
 * Create a new panel. If `code` is omitted, the next sequential PAN-XXXX is
 * generated. Optionally assign it to a property in the same transaction.
 */
export async function createPanel(input: {
  code?: string;
  label?: string | null;
  propertyId?: string | null;
  agentOverrideId?: string | null;
  notes?: string | null;
  assignedById?: string | null;
}) {
  const code = input.code?.trim() || (await nextPanelCode());
  const propertyId = input.propertyId || null;

  return prisma.$transaction(async (tx) => {
    const panel = await tx.panel.create({
      data: {
        code,
        label: input.label ?? null,
        notes: input.notes ?? null,
        agentOverrideId: input.agentOverrideId ?? null,
        propertyId,
        status: propertyId ? "ACTIF" : "DISPONIBLE",
      },
    });

    if (propertyId) {
      await tx.panelAssignment.create({
        data: {
          panelId: panel.id,
          propertyId,
          assignedById: input.assignedById ?? null,
          reason: "Création",
        },
      });
    }

    return panel;
  });
}

/**
 * Reassign a panel to a different property (or detach it if propertyId=null).
 * The previous assignment is closed (unassignedAt set) and a new one opened.
 * Idempotent if the panel is already pointing to the same property.
 */
export async function assignPanel(input: {
  panelId: string;
  propertyId: string | null;
  assignedById?: string | null;
  reason?: string | null;
  agentOverrideId?: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    const panel = await tx.panel.findUnique({
      where: { id: input.panelId },
      select: { id: true, propertyId: true, status: true },
    });
    if (!panel) throw new Error("Panneau introuvable");

    const same = panel.propertyId === input.propertyId;

    if (panel.propertyId && !same) {
      await tx.panelAssignment.updateMany({
        where: {
          panelId: panel.id,
          propertyId: panel.propertyId,
          unassignedAt: null,
        },
        data: { unassignedAt: new Date(), reason: input.reason ?? "Réassigné" },
      });
    }

    const nextStatus = input.propertyId ? "ACTIF" : "DISPONIBLE";

    const updated = await tx.panel.update({
      where: { id: panel.id },
      data: {
        propertyId: input.propertyId,
        status: nextStatus,
        agentOverrideId: input.agentOverrideId ?? null,
      },
    });

    if (input.propertyId && !same) {
      await tx.panelAssignment.create({
        data: {
          panelId: panel.id,
          propertyId: input.propertyId,
          assignedById: input.assignedById ?? null,
          reason: input.reason ?? null,
        },
      });
    }

    return updated;
  });
}

export async function retirePanel(panelId: string, reason?: string | null) {
  return prisma.$transaction(async (tx) => {
    const panel = await tx.panel.findUnique({
      where: { id: panelId },
      select: { id: true, propertyId: true },
    });
    if (!panel) throw new Error("Panneau introuvable");

    if (panel.propertyId) {
      await tx.panelAssignment.updateMany({
        where: { panelId: panel.id, propertyId: panel.propertyId, unassignedAt: null },
        data: { unassignedAt: new Date(), reason: reason ?? "Retiré" },
      });
    }
    return tx.panel.update({
      where: { id: panel.id },
      data: { status: "RETIRE", propertyId: null },
    });
  });
}

/**
 * Resolve a panel by its public code, returning the data needed to redirect
 * a scan to WhatsApp (property + agent phone).
 */
export async function resolvePanelForScan(code: string) {
  return prisma.panel.findUnique({
    where: { code },
    include: {
      agentOverride: {
        select: { id: true, firstName: true, lastName: true, phone: true },
      },
      property: {
        select: {
          id: true,
          reference: true,
          title: true,
          type: true,
          transactionType: true,
          surfaceTotal: true,
          city: true,
          district: true,
          assignedTo: {
            select: { id: true, firstName: true, lastName: true, phone: true },
          },
        },
      },
    },
  });
}

export async function listPanels() {
  return prisma.panel.findMany({
    include: {
      property: {
        select: {
          id: true,
          reference: true,
          title: true,
          status: true,
          assignedTo: { select: { firstName: true, lastName: true } },
        },
      },
      agentOverride: { select: { id: true, firstName: true, lastName: true } },
      _count: { select: { scans: true, assignments: true } },
    },
    orderBy: [{ status: "asc" }, { code: "asc" }],
  });
}

export async function findPanelById(id: string) {
  return prisma.panel.findUnique({
    where: { id },
    include: {
      property: {
        select: {
          id: true,
          reference: true,
          title: true,
          status: true,
          assignedTo: {
            select: { firstName: true, lastName: true, phone: true },
          },
        },
      },
      agentOverride: {
        select: { id: true, firstName: true, lastName: true, phone: true },
      },
      assignments: {
        orderBy: { assignedAt: "desc" },
        include: {
          property: { select: { reference: true, title: true } },
          assignedBy: { select: { firstName: true, lastName: true } },
        },
      },
      scans: {
        orderBy: { createdAt: "desc" },
        take: 30,
      },
      _count: { select: { scans: true } },
    },
  });
}
