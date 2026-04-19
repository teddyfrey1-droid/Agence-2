import { prisma } from "@/lib/prisma";
import { sendFollowUpEmail } from "@/lib/email";
import { createNotification } from "@/modules/notifications";

/**
 * Proactive automation service.
 *
 * These routines are meant to run on a schedule (daily) to keep agents
 * reactive without requiring manual triage:
 *  - wake dormant clients with a reminder email
 *  - flag stale deals so they don't fall through the cracks
 *  - alert the assigned agent when a shared property was opened but ignored
 *  - surface overdue tasks to the assignee
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const daysBetween = (a: Date, b: Date) => Math.floor((a.getTime() - b.getTime()) / DAY_MS);

// ────────────────────────────────────────────────────────────────────────────
// Follow-up emails to dormant client-portal users
// ────────────────────────────────────────────────────────────────────────────

export interface FollowUpResult {
  emailsSent: number;
  candidates: number;
  errors: number;
}

/**
 * Send a reminder email to client-portal users whose last tracked activity
 * is older than the admin-configured `followUpDelayDays`.
 *
 * We only send once per cooling-off window by checking the most recent
 * "FOLLOW_UP_EMAIL" tracking record.
 */
export async function runClientFollowUps(): Promise<FollowUpResult> {
  const setting = await prisma.notificationSetting.findFirst({
    where: { category: "CLIENT", followUpDelayDays: { gt: 0 } },
    orderBy: { updatedAt: "desc" },
  });

  if (!setting) return { emailsSent: 0, candidates: 0, errors: 0 };

  const delayDays = setting.followUpDelayDays;
  const cutoff = new Date(Date.now() - delayDays * DAY_MS);

  // Candidate clients: linked to a contact, have an email, account activated.
  const clients = await prisma.user.findMany({
    where: {
      role: "CLIENT",
      isActive: true,
      isActivated: true,
      linkedContactId: { not: null },
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  let emailsSent = 0;
  let errors = 0;
  let candidates = 0;

  for (const client of clients) {
    if (!client.email) continue;

    const lastActivity = await prisma.clientTracking.findFirst({
      where: { userId: client.id, action: { not: "FOLLOW_UP_EMAIL" } },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    const reference = lastActivity?.createdAt ?? client.lastLoginAt ?? client.createdAt;
    if (reference > cutoff) continue;

    // Avoid spamming: only one follow-up per delay window.
    const lastFollowUp = await prisma.clientTracking.findFirst({
      where: { userId: client.id, action: "FOLLOW_UP_EMAIL" },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    if (lastFollowUp && lastFollowUp.createdAt > cutoff) continue;

    candidates++;
    const daysSince = Math.max(1, daysBetween(new Date(), reference));

    try {
      const ok = await sendFollowUpEmail(client.email, client.firstName, daysSince);
      if (ok) {
        emailsSent++;
        await prisma.clientTracking.create({
          data: {
            userId: client.id,
            action: "FOLLOW_UP_EMAIL",
            details: JSON.stringify({ daysSince }),
          },
        });
      } else {
        errors++;
      }
    } catch (err) {
      errors++;
      console.error("[automation] follow-up email failed", err);
    }
  }

  return { emailsSent, candidates, errors };
}

// ────────────────────────────────────────────────────────────────────────────
// Stale deal detection
// ────────────────────────────────────────────────────────────────────────────

export interface StaleDealResult {
  flagged: number;
  notified: number;
}

// How long (days) a deal can stay in a given stage before we nudge the agent.
const STAGE_STALENESS_DAYS: Record<string, number> = {
  PROSPECT: 14,
  DECOUVERTE: 10,
  VISITE: 7,
  NEGOCIATION: 14,
  OFFRE: 10,
  COMPROMIS: 30,
  ACTE: 30,
};

export async function runStaleDealDetection(): Promise<StaleDealResult> {
  const openDeals = await prisma.deal.findMany({
    where: {
      status: { in: ["OUVERT", "EN_COURS"] },
      stage: { in: Object.keys(STAGE_STALENESS_DAYS) as never[] },
    },
    select: {
      id: true,
      title: true,
      reference: true,
      stage: true,
      updatedAt: true,
      assignedToId: true,
    },
  });

  const now = new Date();
  let flagged = 0;
  let notified = 0;

  for (const deal of openDeals) {
    const threshold = STAGE_STALENESS_DAYS[deal.stage];
    if (!threshold) continue;

    const idleDays = daysBetween(now, deal.updatedAt);
    if (idleDays < threshold) continue;
    flagged++;

    if (!deal.assignedToId) continue;

    // Don't renotify for the same staleness window — check existing notifs.
    const alreadyNotified = await prisma.notification.findFirst({
      where: {
        userId: deal.assignedToId,
        type: "DEAL_UPDATE",
        link: `/dashboard/dossiers/${deal.id}`,
        createdAt: { gte: new Date(now.getTime() - threshold * DAY_MS) },
        title: { startsWith: "Dossier en veille" },
      },
      select: { id: true },
    });
    if (alreadyNotified) continue;

    try {
      await createNotification({
        userId: deal.assignedToId,
        type: "DEAL_UPDATE",
        title: "Dossier en veille",
        message: `${deal.title} — ${idleDays} jours sans mise à jour au stade ${deal.stage}`,
        link: `/dashboard/dossiers/${deal.id}`,
      });
      notified++;
    } catch (err) {
      console.error("[automation] stale deal notify failed", err);
    }
  }

  return { flagged, notified };
}

// ────────────────────────────────────────────────────────────────────────────
// Property-share follow-up: opened but no reaction
// ────────────────────────────────────────────────────────────────────────────

export interface ShareFollowUpResult {
  flagged: number;
  notified: number;
}

const SHARE_OPENED_FOLLOWUP_DAYS = 2;

export async function runShareFollowUps(): Promise<ShareFollowUpResult> {
  const cutoff = new Date(Date.now() - SHARE_OPENED_FOLLOWUP_DAYS * DAY_MS);

  const shares = await prisma.propertyShare.findMany({
    where: {
      openedAt: { not: null, lte: cutoff },
      viewCount: { gt: 0 },
    },
    select: {
      id: true,
      propertyId: true,
      sentById: true,
      recipientName: true,
      recipientEmail: true,
      openedAt: true,
      lastViewedAt: true,
      property: { select: { title: true, reference: true } },
      contact: { select: { id: true } },
    },
    take: 200,
  });

  let flagged = 0;
  let notified = 0;

  for (const share of shares) {
    // Skip if the client has replied via an interaction since the open.
    if (share.contact?.id && share.openedAt) {
      const reply = await prisma.interaction.findFirst({
        where: {
          contactId: share.contact.id,
          propertyId: share.propertyId,
          date: { gte: share.openedAt },
        },
        select: { id: true },
      });
      if (reply) continue;
    }

    // Skip if we already nudged the agent about this specific share.
    const alreadyNudged = await prisma.notification.findFirst({
      where: {
        userId: share.sentById,
        type: "PROPOSAL_OPENED",
        link: `/dashboard/biens/${share.propertyId}`,
        title: "Relancer un prospect",
      },
      select: { id: true },
    });
    if (alreadyNudged) continue;

    flagged++;

    try {
      const who = share.recipientName || share.recipientEmail;
      await createNotification({
        userId: share.sentById,
        type: "PROPOSAL_OPENED",
        title: "Relancer un prospect",
        message: `${who} a consulté "${share.property.title}" il y a ${daysBetween(new Date(), share.openedAt!)} j. sans suite`,
        link: `/dashboard/biens/${share.propertyId}`,
      });
      notified++;
    } catch (err) {
      console.error("[automation] share follow-up notify failed", err);
    }
  }

  return { flagged, notified };
}

// ────────────────────────────────────────────────────────────────────────────
// Overdue task nudges
// ────────────────────────────────────────────────────────────────────────────

export interface OverdueTaskResult {
  notified: number;
}

export async function runOverdueTaskNudges(): Promise<OverdueTaskResult> {
  const now = new Date();

  const overdue = await prisma.task.findMany({
    where: {
      status: { in: ["A_FAIRE", "EN_COURS"] },
      dueDate: { lt: now },
      assignedToId: { not: null },
    },
    select: {
      id: true,
      title: true,
      dueDate: true,
      assignedToId: true,
    },
  });

  let notified = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const task of overdue) {
    if (!task.assignedToId) continue;
    // Once per day per task
    const alreadyToday = await prisma.notification.findFirst({
      where: {
        userId: task.assignedToId,
        type: "TASK_DUE",
        message: task.title,
        createdAt: { gte: today },
      },
      select: { id: true },
    });
    if (alreadyToday) continue;

    try {
      await createNotification({
        userId: task.assignedToId,
        type: "TASK_DUE",
        title: "Tâche en retard",
        message: task.title,
        link: `/dashboard/taches`,
      });
      notified++;
    } catch (err) {
      console.error("[automation] overdue task notify failed", err);
    }
  }

  return { notified };
}

// ────────────────────────────────────────────────────────────────────────────
// New-search escalation: no agent assigned within 2h
// ────────────────────────────────────────────────────────────────────────────

export interface UnassignedSearchResult {
  notified: number;
}

const UNASSIGNED_ESCALATION_MINUTES = 120;

export async function runUnassignedSearchEscalation(): Promise<UnassignedSearchResult> {
  const cutoff = new Date(Date.now() - UNASSIGNED_ESCALATION_MINUTES * 60 * 1000);

  const unassigned = await prisma.searchRequest.findMany({
    where: {
      status: "NOUVELLE",
      assignedToId: null,
      createdAt: { lt: cutoff },
    },
    select: {
      id: true,
      reference: true,
      createdAt: true,
      contact: { select: { firstName: true, lastName: true, company: true } },
    },
    take: 50,
  });

  if (unassigned.length === 0) return { notified: 0 };

  // Escalate to all managers / dirigeants — whoever sees it first grabs it.
  const managers = await prisma.user.findMany({
    where: { role: { in: ["MANAGER", "DIRIGEANT", "ASSOCIE"] }, isActive: true },
    select: { id: true },
  });

  let notified = 0;

  for (const sr of unassigned) {
    // Once per search request
    const alreadyEscalated = await prisma.notification.findFirst({
      where: {
        type: "CLIENT_REQUEST",
        link: `/dashboard/demandes/${sr.id}`,
        title: "Demande non attribuée",
      },
      select: { id: true },
    });
    if (alreadyEscalated) continue;

    const contactName = sr.contact
      ? `${sr.contact.firstName} ${sr.contact.lastName}${sr.contact.company ? ` (${sr.contact.company})` : ""}`
      : "Prospect";

    for (const m of managers) {
      try {
        await createNotification({
          userId: m.id,
          type: "CLIENT_REQUEST",
          title: "Demande non attribuée",
          message: `${sr.reference} — ${contactName} attend depuis plus de ${UNASSIGNED_ESCALATION_MINUTES} min`,
          link: `/dashboard/demandes/${sr.id}`,
        });
        notified++;
      } catch (err) {
        console.error("[automation] unassigned escalation failed", err);
      }
    }
  }

  return { notified };
}
