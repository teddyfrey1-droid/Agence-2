import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { Logo } from "@/components/ui/logo";

export function PublicFooter() {
  return (
    <footer className="border-t border-stone-200 bg-anthracite-950 text-stone-300">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <Logo size="md" variant="light" />
            <p className="mt-4 text-sm leading-relaxed text-stone-400">
              Votre partenaire en immobilier commercial et professionnel à Paris.
              Expertise, conseil et accompagnement sur-mesure.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-stone-200">
              Navigation
            </h4>
            <ul className="mt-4 space-y-2">
              {[
                { href: "/biens", label: "Nos biens" },
                { href: "/agence", label: "L'agence" },
                { href: "/recherche-local", label: "Rechercher un local" },
                { href: "/proposer-bien", label: "Proposer un bien" },
                { href: "/contact", label: "Contact" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-stone-400 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Expertise */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-stone-200">
              Expertise
            </h4>
            <ul className="mt-4 space-y-2 text-sm text-stone-400">
              <li>Boutiques</li>
              <li>Bureaux</li>
              <li>Locaux commerciaux</li>
              <li>Restaurants</li>
              <li>Locaux d&apos;activité</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-stone-200">
              Contact
            </h4>
            <div className="mt-4 space-y-3 text-sm text-stone-400">
              <p>Paris, France</p>
              <p>contact@agence-immo.fr</p>
              <p>01 00 00 00 00</p>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-stone-800 pt-8 text-center text-xs text-stone-500">
          <p>
            &copy; {new Date().getFullYear()} {APP_NAME}. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
