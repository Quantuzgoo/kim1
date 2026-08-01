"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const LS_PERSONALISATION = "nova-personalisation";
const DEFAULTS = {
  brandText: "NOVA BODYWORKS",
  logoUrl: "",
  accentColor: "#22d3ee",
};

export default function BrandLogo() {
  const [brand, setBrand] = useState(DEFAULTS);

  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem(LS_PERSONALISATION);
        setBrand(raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS);
      } catch {
        setBrand(DEFAULTS);
      }
    };

    load();
    window.addEventListener("nova-brand-change", load);
    window.addEventListener("storage", load);

    return () => {
      window.removeEventListener("nova-brand-change", load);
      window.removeEventListener("storage", load);
    };
  }, []);

  if (brand.logoUrl) {
    return (
      <Link href="/" className="flex items-center">
        <img src={brand.logoUrl} alt="Site logo" className="h-9 w-auto" />
      </Link>
    );
  }

  const parts = String(brand.brandText || DEFAULTS.brandText).split(" ");
  const first = parts[0];
  const rest = parts.slice(1).join(" ");

  return (
    <Link href="/" className="font-display text-2xl font-bold tracking-wider">
      {first}
      {rest && (
        <span className="ml-2" style={{ color: brand.accentColor }}>
          {rest}
        </span>
      )}
    </Link>
  );
}
