import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";

type NotificationType = "MATCH_NEW" | "MATCH_HIGH" | "PROPERTY_NEW" | "DEAL_UPDATE" | "TASK_DUE" | "SYSTEM";

export async function createNotification(data: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}) {
  const notification = await prisma.notification.create({ data });

  // Fire-and-forget push notification (non-blocking)
  sendPushToUser(data.userId, {
    title: data.title,
    message: data.message,
    link: data.link,
  }).catch(() => {/* ignore push errors */});

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
