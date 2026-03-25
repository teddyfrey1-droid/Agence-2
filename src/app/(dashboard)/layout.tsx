import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { USER_ROLE_LABELS } from "@/lib/constants";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <DashboardSidebar />
      <div className="pl-64">
        <DashboardHeader
          user={{
            firstName: session.firstName,
            lastName: session.lastName,
            role: USER_ROLE_LABELS[session.role] || session.role,
          }}
        />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
