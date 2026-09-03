"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", id: "tape", label: "Tape" },
  { href: "/calc", id: "calc", label: "Calc" },
  { href: "/cos", id: "cos", label: "Cos" },
  { href: "/news", id: "news", label: "News" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function Nav() {
  const pathname = usePathname();
  return (
    <>
      <header className="site-header">
        <div className="inner">
          <Link className="brand" href="/"><span className="brand-mark">B</span><span>btcpershare</span></Link>
          <nav className="desktop-nav">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className={isActive(pathname, l.href) ? "active" : ""}>{l.id === "calc" ? "Calculators" : l.id === "cos" ? "Companies" : l.label}</Link>
            ))}
          </nav>
        </div>
      </header>
      <nav className="bottom-nav">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className={isActive(pathname, l.href) ? "active" : ""}>{l.label}</Link>
        ))}
      </nav>
    </>
  );
}
