import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-stone-100 dark:bg-anthracite-800">
        <svg className="h-10 w-10 text-stone-400 dark:text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
        </svg>
      </div>
      <h1 className="text-2xl font-semibold text-anthracite-900 dark:text-stone-100">Page introuvable</h1>
      <p className="mt-2 max-w-sm text-sm text-stone-500 dark:text-stone-400">
        La page que vous recherchez n&apos;existe pas ou a ete deplacee.
      </p>
      <div className="mt-6">
        <Link href="/dashboard">
          <Button>Retour au tableau de bord</Button>
        </Link>
      </div>
    </div>
  );
}
