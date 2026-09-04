"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

/** News is placeholder — hide until real English filings feed ships. Calc + Cos are real. */
const links = [
  { href: "/", id: "tape", label: "Tape", desktop: "Tape" },
  { href: "/calc", id: "calc", label: "Calc", desktop: "Calculators" },
  { href: "/cos", id: "cos", label: "Cos", desktop: "Companies" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function Nav() {
  const pathname = usePathname();
  const n = links.length;
  return (
    <>
      <header className="site-header">
        <div className="inner">
          <Link className="brand" href="/">
            <span className="brand-mark">B</span>
            <span>btcpershare</span>
          </Link>
          <nav className="desktop-nav">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className={isActive(pathname, l.href) ? "active" : ""}>
                {l.desktop}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <nav className="bottom-nav" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
        {links.map((l) => (
          <Link key={l.href} href={l.href} className={isActive(pathname, l.href) ? "active" : ""}>
            {l.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
