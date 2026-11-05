import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import type { ReactNode } from "react";
import AuthButton from "@/components/auth/AuthButton";
import ConsentBanner from "@/components/consent/ConsentBanner";
import { publicEnv } from "@/lib/env";
import { HOME_DESCRIPTION, HOME_TITLE, SITE_NAME, canonicalUrl } from "@/lib/seo";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.NEXT_PUBLIC_SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: HOME_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: HOME_DESCRIPTION,
  openGraph: {
    title: { absolute: HOME_TITLE },
    description: HOME_DESCRIPTION,
    url: canonicalUrl("/"),
    siteName: SITE_NAME,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: { absolute: HOME_TITLE },
    description: HOME_DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

const navLinks = [
  { href: "/", label: "Parks" },
  { href: "/neighborhoods", label: "Neighborhoods" },
  { href: "/submit", label: "Suggest a park" },
  { href: "/about", label: "About" },
];

const footerLinks = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/contact", label: "Contact" },
];

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <header className="border-b border-zinc-200">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
            <Link href="/" className="text-lg font-bold">
              ATL Dog Parks
            </Link>
            <nav aria-label="Main" className="flex flex-wrap items-center gap-4 text-sm">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className="hover:underline">
                  {link.label}
                </Link>
              ))}
              <AuthButton />
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
        <footer className="border-t border-zinc-200 text-sm text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6">
            <nav aria-label="Footer" className="flex flex-wrap gap-4">
              {footerLinks.map((link) => (
                <Link key={link.href} href={link.href} className="hover:underline">
                  {link.label}
                </Link>
              ))}
            </nav>
            <p>
              Park details change. Confirm rules and hours before you visit; you visit at your own
              risk.
            </p>
          </div>
        </footer>
        <ConsentBanner />
      </body>
    </html>
  );
}
