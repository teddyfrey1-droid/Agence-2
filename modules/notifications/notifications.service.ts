import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";
import { sendNotificationEmail } from "@/lib/email";
import { publish } from "@/lib/event-bus";

type NotificationType = "MATCH_NEW" | "MATCH_HIGH" | "PROPERTY_NEW" | "DEAL_UPDATE" | "TASK_DUE" | "SYSTEM" | "DEAL_ASSIGNED" | "TASK_ASSIGNED" | "CLIENT_REQUEST" | "CLIENT_ACCOUNT_CREATED" | "FIELD_SPOTTING_NEW" | "PROPOSAL_OPENED";

// Map notification types to setting event types
const TYPE_TO_EVENT: Record<NotificationType, string> = {
  MATCH_NEW: "MATCH_FOUND",
  MATCH_HIGH: "MATCH_HIGH",
  PROPERTY_NEW: "PROPERTY_NEW",
  DEAL_UPDATE: "DEAL_UPDATE",
  DEAL_ASSIGNED: "DEAL_ASSIGNED",
  TASK_DUE: "TASK_DUE",
  TASK_ASSIGNED: "TASK_ASSIGNED",
  CLIENT_REQUEST: "CLIENT_REQUEST",
  CLIENT_ACCOUNT_CREATED: "CLIENT_ACCOUNT_CREATED",
  FIELD_SPOTTING_NEW: "FIELD_SPOTTING_NEW",
  PROPOSAL_OPENED: "PROPOSAL_OPENED",
  SYSTEM: "SYSTEM",
};

// Cache notification settings (refreshed every 5 min)
let settingsCache: Array<{ eventType: string; category: string; pushEnabled: boolean; emailEnabled: boolean; targetRoles: string[] }> | null = null;
let settingsCacheTime = 0;

async function getSettings() {
  const now = Date.now();
  if (settingsCache && now - settingsCacheTime < 5 * 60 * 1000) {
    return settingsCache;
  }
  settingsCache = await prisma.notificationSetting.findMany({
    select: { eventType: true, category: true, pushEnabled: true, emailEnabled: true, targetRoles: true },
  });
  settingsCacheTime = now;
  return settingsCache;
}

export async function createNotification(data: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}) {
  // Always create the in-app notification
  const notification = await prisma.notification.create({ data });

  // Push to any open SSE connection for this user — instant delivery,
  // no 30s polling wait.
  publish(data.userId, {
    type: "notification",
    id: notification.id,
    title: notification.title,
    message: notification.message,
    link: notification.link ?? undefined,
    createdAt: notification.createdAt.toISOString(),
  });

  // Check settings for push and email
  const settings = await getSettings();
  const eventType = TYPE_TO_EVENT[data.type] || data.type;
  const setting = settings.find((s) => s.eventType === eventType && s.category === "COLLABORATEUR");

  // Get user role for role-based filtering
  const user = await prisma.user.findUnique({
    where: { id: data.userId },
    select: { role: true, email: true, firstName: true },
  });

  if (!user) return notification;

  // Check role targeting
  const roleAllowed = !setting?.targetRoles?.length || setting.targetRoles.includes(user.role);

  // Send push if enabled (or no setting exists = default behavior)
  if ((!setting || (setting.pushEnabled && roleAllowed))) {
    sendPushToUser(data.userId, {
      title: data.title,
      message: data.message,
      link: data.link,
    }).catch(() => {});
  }

  // Send email if enabled
  if (setting?.emailEnabled && roleAllowed && user.email) {
    sendNotificationEmail(
      user.email,
      user.firstName,
      data.title,
      data.message,
      data.link,
    ).catch(() => {});
  }

  return notification;
}

export async function notifyMatchFound(params: {
  userId: string;
  propertyTitle: string;
  score: number;
  propertyId: string;
}) {
  const isHigh = params.score >= 70;
  return createNotification({
    userId: params.userId,
    type: isHigh ? "MATCH_HIGH" : "MATCH_NEW",
    title: isHigh ? "Match excellent !" : "Nouveau match",
    message: `${params.propertyTitle} — Score: ${params.score}/100`,
    link: `/dashboard/biens/${params.propertyId}`,
  });
}

export async function notifyNewProperty(params: {
  userId: string;
  propertyTitle: string;
  propertyId: string;
}) {
  return createNotification({
    userId: params.userId,
    type: "PROPERTY_NEW",
    title: "Nouveau bien ajouté",
    message: params.propertyTitle,
    link: `/dashboard/biens/${params.propertyId}`,
  });
}

export async function notifyTaskDue(params: {
  userId: string;
  taskTitle: string;
  taskId: string;
}) {
  return createNotification({
    userId: params.userId,
    type: "TASK_DUE",
    title: "Tâche en retard",
    message: params.taskTitle,
    link: `/dashboard/taches`,
  });
}

export async function notifyDealUpdate(params: {
  userId: string;
  dealTitle: string;
  newStage: string;
  dealId: string;
}) {
  return createNotification({
    userId: params.userId,
    type: "DEAL_UPDATE",
    title: "Dossier mis à jour",
    message: `${params.dealTitle} — ${params.newStage}`,
    link: `/dashboard/dossiers/${params.dealId}`,
  });
}

export async function notifyDealAssigned(params: {
  userId: string;
  dealTitle: string;
  dealId: string;
}) {
  return createNotification({
    userId: params.userId,
    type: "DEAL_ASSIGNED",
    title: "Dossier assigné",
    message: `Le dossier "${params.dealTitle}" vous a été assigné`,
    link: `/dashboard/dossiers/${params.dealId}`,
  });
}

export async function notifyTaskAssigned(params: {
  userId: string;
  taskTitle: string;
  taskId: string;
}) {
  return createNotification({
    userId: params.userId,
    type: "TASK_ASSIGNED",
    title: "Nouvelle tâche assignée",
    message: params.taskTitle,
    link: `/dashboard/taches`,
  });
}

export async function notifyClientRequest(params: {
  userId: string;
  contactName: string;
  requestId: string;
}) {
  return createNotification({
    userId: params.userId,
    type: "CLIENT_REQUEST",
    title: "Nouvelle demande client",
    message: `${params.contactName} a soumis une demande de recherche`,
    link: `/dashboard/demandes/${params.requestId}`,
  });
}

export async function notifyProposalOpened(params: {
  userId: string;
  contactName: string;
  propertyTitle: string;
  propertyId: string;
}) {
  return createNotification({
    userId: params.userId,
    type: "PROPOSAL_OPENED",
    title: "Proposition consultée",
    message: `${params.contactName} a consulté "${params.propertyTitle}"`,
    link: `/dashboard/biens/${params.propertyId}`,
  });
}
