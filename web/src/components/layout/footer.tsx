import Link from "next/link";

const footerLinks = [
  { name: "About", href: "/about" },
  { name: "Pricing", href: "/pricing" },
  { name: "Contact", href: "/contact" },
  { name: "Privacy", href: "/privacy" },
  { name: "Terms", href: "/terms" },
];

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-background)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
          {/* Links */}
          <nav className="flex flex-wrap items-center gap-4 text-sm text-[var(--color-muted-foreground)]">
            {footerLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="hover:text-[var(--color-foreground)] transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Copyright */}
          <p className="text-sm text-[var(--color-muted-foreground)]">
            &copy; {new Date().getFullYear()} Index.ai
          </p>
        </div>
      </div>
    </footer>
  );
}
