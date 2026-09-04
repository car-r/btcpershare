import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "./components/Nav";

export const metadata: Metadata = {
  title: "btcpershare — sats/share tape",
  description:
    "Companies that buy Bitcoin with stock can make each share own more Bitcoin — or less. This site watches that number, and the price tag on it. Not financial advice.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <main className="page">{children}</main>
        <footer className="site-footer">Not financial advice.</footer>
      </body>
    </html>
  );
}
