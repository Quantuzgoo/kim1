"use client";

import { useMemo, useState } from "react";

const basePriceMap = {
  scratch: 110,
  dent: 160,
  bumper: 140,
  alloy: 95,
};

export default function QuoteCalculator() {
  const [damageType, setDamageType] = useState("scratch");
  const [severity, setSeverity] = useState("small");
  const [panels, setPanels] = useState(1);
  const [saveMessage, setSaveMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const estimate = useMemo(() => {
    const base = basePriceMap[damageType] || 120;
    const severityMultiplier = severity === "small" ? 1 : severity === "medium" ? 1.35 : 1.8;
    const panelFactor = Math.max(1, Number(panels));

    const low = Math.round(base * severityMultiplier * panelFactor);
    const high = Math.round(low * 1.25);

    return { low, high };
  }, [damageType, severity, panels]);

  const handleSaveQuote = async () => {
    setIsSaving(true);
    setSaveMessage("");

    try {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ damageType, severity, panels: Number(panels) }),
      });
      const data = await response.json();

      if (response.status === 401) {
        setSaveMessage("Please log in (top right) to save your quote.");
        return;
      }
      if (!response.ok) {
        setSaveMessage(data.error || "Could not save quote. Please try again.");
        return;
      }

      setSaveMessage("Quote saved! View it in My Account.");
    } catch {
      setSaveMessage("Could not reach the server. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6">
      <h2 className="font-display text-3xl font-bold text-white">Quick Estimate</h2>
      <p className="mt-2 text-sm text-slate-300">Instant price range based on typical cosmetic repairs.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="text-sm text-slate-200">
          Damage Type
          <select
            value={damageType}
            onChange={(event) => setDamageType(event.target.value)}
            className="mt-1 block w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-white"
          >
            <option value="scratch">Scratch</option>
            <option value="dent">Dent</option>
            <option value="bumper">Bumper scuff</option>
            <option value="alloy">Alloy wheel</option>
          </select>
        </label>

        <label className="text-sm text-slate-200">
          Severity
          <select
            value={severity}
            onChange={(event) => setSeverity(event.target.value)}
            className="mt-1 block w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-white"
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </label>

        <label className="text-sm text-slate-200 sm:col-span-2">
          Number of affected panels/areas
          <input
            min={1}
            max={6}
            type="number"
            value={panels}
            onChange={(event) => setPanels(event.target.value)}
            className="mt-1 block w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-white"
          />
        </label>
      </div>

      <div className="mt-6 rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-4">
        <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">Estimated Range</p>
        <p className="mt-2 text-3xl font-extrabold text-white">GBP {estimate.low} - GBP {estimate.high}</p>
      </div>

      <button
        type="button"
        onClick={handleSaveQuote}
        disabled={isSaving}
        className="mt-4 w-full rounded-md bg-cyan-400 px-4 py-2 text-sm font-extrabold uppercase tracking-wide text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSaving ? "Saving..." : "Save Quote to My Account"}
      </button>
      {saveMessage && <p className="mt-3 text-sm text-cyan-200">{saveMessage}</p>}
    </div>
  );
}
