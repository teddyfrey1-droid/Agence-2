import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// Default notification settings seed
const DEFAULT_SETTINGS = [
  // ── Collaborateur events ──
  { eventType: "PROPERTY_NEW", category: "COLLABORATEUR", label: "Nouveau bien ajouté", description: "Un nouveau bien est rentré dans la base de données", pushEnabled: true, emailEnabled: false, targetRoles: [] },
  { eventType: "MATCH_FOUND", category: "COLLABORATEUR", label: "Nouveau match trouvé", description: "Un match est trouvé entre un bien et une demande", pushEnabled: true, emailEnabled: false, targetRoles: [] },
  { eventType: "MATCH_HIGH", category: "COLLABORATEUR", label: "Match excellent (>70%)", description: "Un match de score élevé nécessitant une action rapide", pushEnabled: true, emailEnabled: true, targetRoles: [] },
  { eventType: "DEAL_ASSIGNED", category: "COLLABORATEUR", label: "Dossier assigné", description: "Un dossier est assigné à un collaborateur", pushEnabled: true, emailEnabled: true, targetRoles: [] },
  { eventType: "DEAL_UPDATE", category: "COLLABORATEUR", label: "Dossier mis à jour", description: "Le statut d'un dossier a changé", pushEnabled: true, emailEnabled: false, targetRoles: [] },
  { eventType: "TASK_DUE", category: "COLLABORATEUR", label: "Tâche en retard", description: "Une tâche a dépassé sa date d'échéance", pushEnabled: true, emailEnabled: true, targetRoles: [] },
  { eventType: "TASK_ASSIGNED", category: "COLLABORATEUR", label: "Tâche assignée", description: "Une nouvelle tâche est assignée", pushEnabled: true, emailEnabled: false, targetRoles: [] },
  { eventType: "CLIENT_REQUEST", category: "COLLABORATEUR", label: "Nouvelle demande client", description: "Un client soumet une nouvelle demande de recherche", pushEnabled: true, emailEnabled: true, targetRoles: ["AGENT", "MANAGER", "DIRIGEANT"] },
  { eventType: "CLIENT_ACCOUNT_CREATED", category: "COLLABORATEUR", label: "Nouveau compte client", description: "Un client a créé son compte sur le portail", pushEnabled: true, emailEnabled: false, targetRoles: ["AGENT", "MANAGER"] },
  { eventType: "FIELD_SPOTTING_NEW", category: "COLLABORATEUR", label: "Nouveau repérage terrain", description: "Un nouveau bien est repéré sur le terrain", pushEnabled: true, emailEnabled: false, targetRoles: [] },
  { eventType: "PROPOSAL_OPENED", category: "COLLABORATEUR", label: "Proposition consultée", description: "Un client a ouvert une proposition de bien envoyée", pushEnabled: true, emailEnabled: false, targetRoles: ["AGENT"] },

  // ── Client events ──
  { eventType: "MATCHING_PROPERTY", category: "CLIENT", label: "Nouveau bien correspondant", description: "Un bien correspond aux critères de recherche du client", pushEnabled: false, emailEnabled: true, targetRoles: [], followUpDelayDays: 0 },
  { eventType: "PROPOSAL_SENT", category: "CLIENT", label: "Proposition de bien", description: "L'agence envoie une proposition de bien au client", pushEnabled: false, emailEnabled: true, targetRoles: [], followUpDelayDays: 0 },
  { eventType: "DEAL_STATUS_CHANGE", category: "CLIENT", label: "Avancement du dossier", description: "Le client est informé de l'avancement de son dossier", pushEnabled: false, emailEnabled: true, targetRoles: [], followUpDelayDays: 0 },
  { eventType: "FOLLOWUP_SEARCH", category: "CLIENT", label: "Relance recherche active", description: "Relancer le client pour savoir s'il recherche toujours", pushEnabled: false, emailEnabled: true, targetRoles: [], followUpDelayDays: 30 },
  { eventType: "WELCOME_EMAIL", category: "CLIENT", label: "Email de bienvenue", description: "Email envoyé après activation du compte client", pushEnabled: false, emailEnabled: true, targetRoles: [], followUpDelayDays: 0 },
  { eventType: "INACTIVITY_REMINDER", category: "CLIENT", label: "Rappel d'inactivité", description: "Relancer un client inactif depuis un certain temps", pushEnabled: false, emailEnabled: true, targetRoles: [], followUpDelayDays: 60 },
];

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  let settings = await prisma.notificationSetting.findMany({
    orderBy: [{ category: "asc" }, { eventType: "asc" }],
  });

  // Seed defaults if empty
  if (settings.length === 0) {
    await prisma.notificationSetting.createMany({
      data: DEFAULT_SETTINGS.map((s) => ({
        ...s,
        followUpDelayDays: s.followUpDelayDays ?? 0,
      })),
    });
    settings = await prisma.notificationSetting.findMany({
      orderBy: [{ category: "asc" }, { eventType: "asc" }],
    });
  }

  return NextResponse.json(settings);
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!["SUPER_ADMIN", "DIRIGEANT"].includes(session.role)) {
    return NextResponse.json({ error: "Permissions insuffisantes" }, { status: 403 });
  }

  const body = await request.json();
  const { settings } = body as { settings: Array<{ id: string; pushEnabled: boolean; emailEnabled: boolean; targetRoles: string[]; followUpDelayDays?: number }> };

  if (!Array.isArray(settings)) {
    return NextResponse.json({ error: "Format invalide" }, { status: 400 });
  }

  const updates = await Promise.all(
    settings.map((s) =>
      prisma.notificationSetting.update({
        where: { id: s.id },
        data: {
          pushEnabled: s.pushEnabled,
          emailEnabled: s.emailEnabled,
          targetRoles: s.targetRoles,
          followUpDelayDays: s.followUpDelayDays ?? 0,
        },
      })
    )
  );

  return NextResponse.json(updates);
}
