import Link from "next/link";
import type { ReactNode } from "react";

const legalLinks = [
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/contact", label: "Contact" },
];

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl">
      <nav aria-label="Information and policies" className="mb-8 flex flex-wrap gap-4 text-sm">
        {legalLinks.map((link) => (
          <Link key={link.href} href={link.href} className="underline underline-offset-4">
            {link.label}
          </Link>
        ))}
      </nav>
      <article className="space-y-8 [&_a]:underline [&_a]:underline-offset-4 [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_p]:leading-7 [&_ul]:space-y-2">
        {children}
      </article>
    </div>
  );
}
