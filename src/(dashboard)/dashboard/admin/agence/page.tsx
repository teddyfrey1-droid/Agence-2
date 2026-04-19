import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { canAccessAdmin } from "@/lib/permissions";
import { getAgencyInfo } from "@/lib/agency";
import { AgencySettingsForm } from "./agency-settings-form";

export const dynamic = "force-dynamic";

export default async function AdminAgencePage() {
  const session = await getSession();
  if (!session || !canAccessAdmin(session.role)) redirect("/dashboard");

  const agency = await getAgencyInfo();

  return <AgencySettingsForm initial={agency} />;
}
