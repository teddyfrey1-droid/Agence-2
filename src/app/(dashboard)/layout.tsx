import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardSidebar, SidebarProvider } from "@/components/layout/dashboard-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { USER_ROLE_LABELS } from "@/lib/constants";
import { ActivityTracker } from "@/components/activity-tracker";
import { PushNotifications } from "@/components/push-notifications";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role === "CLIENT") {
    redirect("/espace-client");
  }

  // Fetch badge counts for sidebar
  const [overdueTaskCount, newDemandCount] = await Promise.all([
    prisma.task.count({
      where: {
        status: { in: ["A_FAIRE", "EN_COURS"] },
        dueDate: { lt: new Date() },
      },
    }).catch(() => 0),
    prisma.searchRequest.count({
      where: { status: "NOUVELLE" },
    }).catch(() => 0),
  ]);

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-stone-50 dark:bg-anthracite-950">
        <DashboardSidebar
          badges={{
            "/dashboard/taches": overdueTaskCount,
            "/dashboard/demandes": newDemandCount,
          }}
        />
        <div className="lg:pl-64">
          <DashboardHeader
            user={{
              firstName: session.firstName,
              lastName: session.lastName,
              role: USER_ROLE_LABELS[session.role] || session.role,
            }}
          />
          <ActivityTracker />
          <PushNotifications />
          <main className="animate-fade-in px-4 pt-4 pb-safe-or-4 sm:px-6 sm:pt-6 sm:pb-safe-or-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
