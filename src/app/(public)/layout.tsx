import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { FloatingThemeToggle } from "@/components/floating-theme-toggle";
import { getSession } from "@/lib/auth";
import { USER_ROLE_LABELS } from "@/lib/constants";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  const user = session
    ? {
        firstName: session.firstName,
        lastName: session.lastName,
        role: USER_ROLE_LABELS[session.role] || session.role,
      }
    : null;

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader user={user} />
      <main className="flex-1">{children}</main>
      <PublicFooter />
      <FloatingThemeToggle />
    </div>
  );
}
