import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getActiveSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { listPanels } from "@/modules/panels";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { PanelsManager } from "./panels-manager";

export const metadata: Metadata = { title: "Panneaux QR" };
export const dynamic = "force-dynamic";

export default async function PanneauxPage() {
  const session = await getActiveSession();
  if (!session) redirect("/login");
  if (!hasPermission(session.role, "property", "read")) {
    redirect("/dashboard");
  }

  const [panels, properties, agents] = await Promise.all([
    listPanels(),
    prisma.property.findMany({
      where: { status: { in: ["ACTIF", "EN_NEGOCIATION", "BROUILLON"] } },
      select: {
        id: true,
        reference: true,
        title: true,
        status: true,
        assignedTo: { select: { firstName: true, lastName: true, phone: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 200,
    }),
    prisma.user.findMany({
      where: { isActive: true, role: { not: "CLIENT" } },
      select: { id: true, firstName: true, lastName: true, role: true, phone: true },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    }),
  ]);

  // Reshape Date instances to strings for the client component.
  const panelsForClient = panels.map((p) => ({
    id: p.id,
    code: p.code,
    label: p.label,
    status: p.status,
    notes: p.notes,
    propertyId: p.propertyId,
    property: p.property
      ? {
          id: p.property.id,
          reference: p.property.reference,
          title: p.property.title,
          status: p.property.status,
          assignedTo: p.property.assignedTo,
        }
      : null,
    agentOverride: p.agentOverride,
    scanCount: p._count.scans,
    assignmentCount: p._count.assignments,
    updatedAt: p.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-5 p-4 sm:space-y-6 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Visibilité"
        title="Panneaux"
        description="Imprimez un panneau une fois — réassignez-le à un autre bien en un clic après une vente."
        icon={
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v16m0-16h12l-2 4 2 4H4" />
          </svg>
        }
      />

      <PanelsManager panels={panelsForClient} properties={properties} agents={agents} />
    </div>
  );
}
