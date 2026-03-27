import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ActivityTracker } from "@/components/activity-tracker";
import { ClientNavbar } from "./client-navbar";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "CLIENT") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-brand-50 dark:bg-anthracite-950">
      <ClientNavbar
        user={{ firstName: session.firstName, lastName: session.lastName }}
      />
      <ActivityTracker />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
