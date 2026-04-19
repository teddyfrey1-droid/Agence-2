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
      <div className="relative min-h-screen bg-stone-50 dark:bg-anthracite-950">
        {/* Subtle ambient backdrop — barely visible, adds depth */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-0 opacity-[0.55] dark:opacity-100"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 1100px 540px at 18% -8%, rgba(176,146,106,0.08), transparent 60%), radial-gradient(ellipse 900px 480px at 92% 110%, rgba(220,184,126,0.06), transparent 60%)",
          }}
        />
        <DashboardSidebar
          badges={{
            "/dashboard/taches": overdueTaskCount,
            "/dashboard/demandes": newDemandCount,
          }}
        />
        <div className="relative lg:pl-64">
          <DashboardHeader
            user={{
              firstName: session.firstName,
              lastName: session.lastName,
              role: USER_ROLE_LABELS[session.role] || session.role,
            }}
          />
          <ActivityTracker />
          <PushNotifications />
          <main className="animate-fade-in mx-auto w-full max-w-[1600px] px-4 pt-5 pb-safe-or-6 sm:px-8 sm:pt-7">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
