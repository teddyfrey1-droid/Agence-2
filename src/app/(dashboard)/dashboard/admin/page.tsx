import Link from "next/link";
import { Card } from "@/components/ui/card";

const adminSections = [
  {
    title: "Utilisateurs",
    description: "Créer, modifier, inviter et gérer les comptes utilisateurs.",
    href: "/dashboard/admin/utilisateurs",
    icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
  },
  {
    title: "Notifications & Emails",
    description: "Configurer les notifications push et emails par événement, rôle et type de destinataire.",
    href: "/dashboard/admin/notifications",
    icon: "M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0",
  },
  {
    title: "Gestion des accès",
    description: "Permissions par rôle et personnalisation par utilisateur.",
    href: "/dashboard/admin/acces",
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  },
  {
    title: "Journal d'activité",
    description: "Consulter l'historique des actions et audit.",
    href: "/dashboard/admin/journal",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  },
];

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-anthracite-900">Administration</h1>
        <p className="text-sm text-stone-500">Paramètres et gestion du système.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {adminSections.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card hover className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600 flex-shrink-0">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={section.icon} />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-anthracite-900">{section.title}</h3>
                  <p className="mt-1 text-sm text-stone-500">{section.description}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
