import { NextRequest, NextResponse } from "next/server";
import { getActiveSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { findTaskById, updateTask } from "@/modules/tasks";
import { updateTaskSchema } from "@/modules/tasks/tasks.schema";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getActiveSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    if (!hasPermission(session.role, "task", "read")) {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
    }
    const { id } = await params;
    const task = await findTaskById(id);
    if (!task) {
      return NextResponse.json({ error: "Tâche introuvable" }, { status: 404 });
    }
    return NextResponse.json(task);
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getActiveSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    if (!hasPermission(session.role, "task", "update")) {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
    }
    const { id } = await params;
    const body = await request.json();
    const parsed = updateTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const data = parsed.data;
    const task = await updateTask(id, {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.priority !== undefined && { priority: data.priority as never }),
      ...(data.status !== undefined && { status: data.status as never }),
      ...(data.dueDate !== undefined && { dueDate: data.dueDate ? new Date(data.dueDate) : null }),
      ...(data.assignedToId !== undefined && {
        assignedTo: data.assignedToId ? { connect: { id: data.assignedToId } } : { disconnect: true },
      }),
    });
    return NextResponse.json(task);
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getActiveSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    if (!hasPermission(session.role, "task", "delete")) {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
    }
    const { id } = await params;
    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
