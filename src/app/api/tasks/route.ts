import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { createTaskSchema } from "@/modules/tasks/tasks.schema";
import { createTask } from "@/modules/tasks";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!hasPermission(session.role, "task", "create")) {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createTaskSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const task = await createTask({
      title: data.title,
      description: data.description ?? null,
      priority: data.priority as never,
      status: "A_FAIRE",
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      createdBy: { connect: { id: session.userId } },
      ...(data.assignedToId ? { assignedTo: { connect: { id: data.assignedToId } } } : {}),
      ...(data.contactId ? { contact: { connect: { id: data.contactId } } } : {}),
      ...(data.propertyId ? { property: { connect: { id: data.propertyId } } } : {}),
      ...(data.searchRequestId ? { searchRequest: { connect: { id: data.searchRequestId } } } : {}),
      ...(data.dealId ? { deal: { connect: { id: data.dealId } } } : {}),
    });

    return NextResponse.json(task, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
