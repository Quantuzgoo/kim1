import Link from "next/link";
import { Space_Grotesk, Rajdhani } from "next/font/google";
import LoginComingSoonButton from "./login-coming-soon-button";
import "./globals.css";

const bodyFont = Space_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
});

const displayFont = Rajdhani({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/quote", label: "Quote" },
  { href: "/reviews", label: "Reviews" },
  { href: "/faqs", label: "FAQs" },
  { href: "/contact", label: "Contact" },
];

export const metadata = {
  title: "Nova Bodyworks | Mobile Car Cosmetic Repairs",
  description:
    "Mobile SMART car bodywork repairs for scratches, dents, bumper scuffs, and alloy wheels. Fast quotes, modern booking, and nationwide coverage.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${bodyFont.variable} ${displayFont.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-slate-950 text-slate-100">
        <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/85 backdrop-blur">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
            <Link href="/" className="font-display text-2xl font-bold tracking-wider">
              NOVA
              <span className="ml-2 text-cyan-300">BODYWORKS</span>
            </Link>

            <nav className="hidden items-center gap-6 text-sm font-semibold md:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-slate-200 transition hover:text-cyan-300"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <LoginComingSoonButton />
          </div>
        </header>

        {children}

        <footer className="border-t border-white/10 bg-slate-950/90">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-slate-300 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <p>Nova Bodyworks - Mobile SMART repair specialists.</p>
            <p>Serving UK drivers with on-site cosmetic repair solutions.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
