import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

const adminSections = [
  {
    title: "Utilisateurs",
    description: "Gérer les utilisateurs, rôles et accès.",
    href: "/dashboard/admin/utilisateurs",
  },
  {
    title: "Journal d'activité",
    description: "Consulter l'historique des actions.",
    href: "/dashboard/admin/journal",
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
              <h3 className="font-semibold text-anthracite-900">{section.title}</h3>
              <p className="mt-1 text-sm text-stone-500">{section.description}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
