import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { USER_ROLE_LABELS } from "@/lib/constants";
import { ActivityTracker } from "@/components/activity-tracker";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // Clients have their own dedicated space
  if (session.role === "CLIENT") {
    redirect("/espace-client");
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-anthracite-950">
      <DashboardSidebar />
      <div className="lg:pl-64">
        <DashboardHeader
          user={{
            firstName: session.firstName,
            lastName: session.lastName,
            role: USER_ROLE_LABELS[session.role] || session.role,
          }}
        />
        <ActivityTracker />
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
