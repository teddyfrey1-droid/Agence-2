import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const q = request.nextUrl.searchParams.get("q")?.trim();
    if (!q || q.length < 2) return NextResponse.json({ results: [] });

    const searchTerm = q.toLowerCase();

    // Filter out confidential properties for non-admin roles
    const isAdmin = hasPermission(session.role, "property", "delete");

    const [properties, contacts, deals] = await Promise.all([
      prisma.property.findMany({
        where: {
          AND: [
            {
              OR: [
                { title: { contains: searchTerm, mode: "insensitive" } },
                { reference: { contains: searchTerm, mode: "insensitive" } },
                { address: { contains: searchTerm, mode: "insensitive" } },
                { district: { contains: searchTerm, mode: "insensitive" } },
              ],
            },
            ...(!isAdmin ? [{ confidentiality: { not: "CONFIDENTIEL" as const } }] : []),
          ],
        },
        select: { id: true, reference: true, title: true, district: true, status: true, type: true },
        take: 5,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.contact.findMany({
        where: {
          OR: [
            { firstName: { contains: searchTerm, mode: "insensitive" } },
            { lastName: { contains: searchTerm, mode: "insensitive" } },
            { email: { contains: searchTerm, mode: "insensitive" } },
            { company: { contains: searchTerm, mode: "insensitive" } },
          ],
        },
        select: { id: true, firstName: true, lastName: true, email: true, company: true, type: true },
        take: 5,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.deal.findMany({
        where: {
          OR: [
            { title: { contains: searchTerm, mode: "insensitive" } },
            { reference: { contains: searchTerm, mode: "insensitive" } },
          ],
        },
        select: { id: true, reference: true, title: true, stage: true, status: true },
        take: 5,
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    const results = [
      ...properties.map((p) => ({
        type: "property" as const,
        id: p.id,
        title: p.title,
        subtitle: p.district || p.reference,
        href: `/dashboard/biens/${p.id}`,
        badge: p.status,
      })),
      ...contacts.map((c) => ({
        type: "contact" as const,
        id: c.id,
        title: `${c.firstName} ${c.lastName}`,
        subtitle: c.company || c.email || "",
        href: `/dashboard/contacts/${c.id}`,
        badge: c.type,
      })),
      ...deals.map((d) => ({
        type: "deal" as const,
        id: d.id,
        title: d.title,
        subtitle: d.reference,
        href: `/dashboard/dossiers/${d.id}`,
        badge: d.stage,
      })),
    ];

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
