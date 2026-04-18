import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedCron } from "@/lib/cron";
import {
  runClientFollowUps,
  runStaleDealDetection,
  runShareFollowUps,
  runOverdueTaskNudges,
  runUnassignedSearchEscalation,
} from "@/modules/automation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Daily proactive automation tick — called by Vercel Cron.
 *
 * Runs every job sequentially so a slow/failed job doesn't block the others.
 * Each job is internally idempotent (it tracks "already notified"), so rerunning
 * the endpoint is safe.
 */
export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const results: Record<string, unknown> = {};

  const jobs = [
    ["clientFollowUps", runClientFollowUps],
    ["staleDeals", runStaleDealDetection],
    ["shareFollowUps", runShareFollowUps],
    ["overdueTasks", runOverdueTaskNudges],
    ["unassignedSearches", runUnassignedSearchEscalation],
  ] as const;

  for (const [name, job] of jobs) {
    try {
      results[name] = await job();
    } catch (err) {
      console.error(`[cron:daily] ${name} failed`, err);
      results[name] = { error: err instanceof Error ? err.message : "unknown" };
    }
  }

  return NextResponse.json({ ok: true, at: new Date().toISOString(), results });
}

export const POST = GET;
