import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { Logo } from "@/components/ui/logo";

export function PublicFooter() {
  return (
    <footer className="border-t border-stone-800 bg-anthracite-950 text-stone-300">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <Logo size="md" variant="light" />
            <p className="mt-4 text-sm leading-relaxed text-stone-400">
              Votre expert en immobilier commercial et professionnel à Paris et
              Île-de-France. Expertise, conseil et accompagnement sur-mesure.
            </p>
            {/* Social links placeholder */}
            <div className="mt-6 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-anthracite-900 text-stone-400 transition-colors hover:bg-anthracite-800 hover:text-white">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </span>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-stone-200">
              Navigation
            </h4>
            <ul className="mt-4 space-y-2.5">
              {[
                { href: "/biens", label: "Nos biens" },
                { href: "/agence", label: "Nos services" },
                { href: "/recherche-local", label: "Rechercher un bien" },
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
            <ul className="mt-4 space-y-2.5 text-sm text-stone-400">
              <li>Boutiques &amp; commerces</li>
              <li>Bureaux</li>
              <li>Locaux commerciaux</li>
              <li>Restaurants &amp; bars</li>
              <li>Fonds de commerce</li>
              <li>Murs commerciaux</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-stone-200">
              Contact
            </h4>
            <div className="mt-4 space-y-3 text-sm text-stone-400">
              <div className="flex items-start gap-2.5">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                <span>Paris &amp; Île-de-France</span>
              </div>
              <div className="flex items-start gap-2.5">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                <span>contact@retailavenue.fr</span>
              </div>
              <div className="flex items-start gap-2.5">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
                <span>01 00 00 00 00</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center gap-4 border-t border-stone-800/80 pt-8 sm:flex-row sm:justify-between">
          <p className="text-xs text-stone-500">
            &copy; {new Date().getFullYear()} {APP_NAME}. Tous droits réservés.
          </p>
          <div className="flex items-center gap-6 text-xs text-stone-500">
            <Link href="/mentions-legales" className="transition-colors hover:text-stone-300">
              Mentions légales
            </Link>
            <Link href="/politique-confidentialite" className="transition-colors hover:text-stone-300">
              Politique de confidentialité
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
