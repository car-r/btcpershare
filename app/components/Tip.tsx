"use client";
import { useId, useState, type ReactNode } from "react";

const TIPS: Record<string, string> = {
  "sats/share": "Bitcoin each share owns, in satoshis (100M sats = 1 BTC).",
  basic: "Common shares outstanding only — no converts or preferred.",
  ADSO: "Assumed diluted shares outstanding (Strategy’s diluted count).",
  AFDS: "Assumed fully diluted shares (Strive’s sats/share print).",
  clean: "Sats/share net of preferred / convert claims when available.",
  accretive: "Sats/share went up — each share owns more Bitcoin.",
  dilutive: "Sats/share went down — each share owns less Bitcoin.",
  flat: "Sats/share unchanged week over week.",
  "mNAV (mkt cap)": "Market cap ÷ Bitcoin on the balance sheet at spot. Not EV.",
  "ATM on": "At-the-market equity program is active.",
  "ATM off": "No active at-the-market equity program.",
  SATA: "Strive preferred equity — never in the sats/share denominator.",
  "SATA on": "SATA preferred is outstanding / being issued.",
  pledged: "Bitcoin pledged as collateral — still held, not spendable free.",
};

export function tipFor(label: string): string {
  return TIPS[label] ?? label;
}

export function Tip({
  label,
  tip,
  className = "",
  children,
}: {
  label: string;
  tip?: string;
  className?: string;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const text = tip ?? tipFor(label);
  return (
    <button
      type="button"
      className={"tip-chip " + className}
      aria-expanded={open}
      aria-describedby={open ? id : undefined}
      onClick={(e) => {
        e.stopPropagation();
        setOpen((v) => !v);
      }}
      onBlur={() => setOpen(false)}
    >
      {children ?? label}
      {open ? (
        <span id={id} role="tooltip" className="tip-bubble">
          {text}
        </span>
      ) : null}
    </button>
  );
}
