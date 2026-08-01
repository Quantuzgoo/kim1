"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { services } from "../_data/services";

const LS_PERSONALISATION = "nova-personalisation";
const LS_LISTS = "nova-service-lists";

const DEFAULT_PERSONALISATION = {
  brandText: "NOVA BODYWORKS",
  logoUrl: "",
  primaryColor: "#0f172a",
  accentColor: "#22d3ee",
};

const MOCK_STOCK = [
  { id: 1, name: "Base Coat Paint (1L)", unit: "Litre", qty: 24, boughtFor: 18.5, soldFor: 42 },
  { id: 2, name: "Clear Lacquer (1L)", unit: "Litre", qty: 16, boughtFor: 21, soldFor: 48 },
  { id: 3, name: "Primer Filler (1L)", unit: "Litre", qty: 30, boughtFor: 12.75, soldFor: 30 },
  { id: 4, name: "Wet Sand Pads (P2000)", unit: "Pack", qty: 12, boughtFor: 6.4, soldFor: 15 },
  { id: 5, name: "Masking Tape (48mm)", unit: "Roll", qty: 40, boughtFor: 2.1, soldFor: 6 },
  { id: 6, name: "Alloy Wheel Powder", unit: "Kg", qty: 9, boughtFor: 14.9, soldFor: 39 },
];

const ACTIVE_REQUEST_STATUSES = ["new", "requested", "pending"];
const PENDING_WORK_STATUSES = ["in_progress", "booked", "pending", "scheduled"];

const thClass =
  "px-3 py-2 text-left text-[0.65rem] font-bold uppercase tracking-[0.14em] text-cyan-300";
const tdClass = "px-3 py-2 text-sm text-slate-200";
const sectionClass = "rounded-xl border border-white/10 bg-slate-900/70 p-5";
const sectionTitleClass = "font-display text-xl font-bold text-white";
const fieldLabelClass =
  "block text-[0.65rem] font-bold uppercase tracking-[0.14em] text-cyan-300";
const controlClass =
  "mt-1 w-full rounded-md border border-white/15 bg-slate-950 px-3 py-2 text-sm text-white";

function formatDate(value) {
  if (!value) {
    return "-";
  }
  const date = new Date(value.includes("T") ? value : `${value.replace(" ", "T")}Z`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function toDate(value) {
  if (!value) {
    return null;
  }
  const date = new Date(value.includes("T") ? value : `${value.replace(" ", "T")}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatMoney(value) {
  return `GBP ${Number(value || 0).toFixed(2)}`;
}

function formatFullAddress(partA, partB, county, postcode) {
  return [partA, partB, county, postcode].map((value) => String(value || "").trim()).filter(Boolean).join(", ");
}

export default function AdminPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [quotes, setQuotes] = useState([]);
  const [clients, setClients] = useState([]);
  const [canManageAdmins, setCanManageAdmins] = useState(false);
  const [adminUpdateIds, setAdminUpdateIds] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [adminNoteDraft, setAdminNoteDraft] = useState("");
  const [isSavingAdminNote, setIsSavingAdminNote] = useState(false);

  const [filterStatus, setFilterStatus] = useState("all");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [filterTask, setFilterTask] = useState("all");

  const [stock] = useState(MOCK_STOCK);

  const [personalisation, setPersonalisation] = useState(DEFAULT_PERSONALISATION);
  const [personalisationSaved, setPersonalisationSaved] = useState(false);
  const logoInputRef = useRef(null);

  const [lists, setLists] = useState([]);
  const [newListItem, setNewListItem] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    setError("");

    try {
      const [quotesResponse, clientsResponse] = await Promise.all([
        fetch("/api/admin/quotes"),
        fetch("/api/admin/clients"),
      ]);

      if (quotesResponse.status === 403 || clientsResponse.status === 403) {
        setError("Admin access required. Please log in with an admin account.");
        setQuotes([]);
        setClients([]);
        return;
      }

      const quotesData = await quotesResponse.json();
      const clientsData = await clientsResponse.json();
      setQuotes(quotesData.quotes || []);
      setClients(clientsData.clients || []);
      setCanManageAdmins(Boolean(clientsData.canManageAdmins));
    } catch {
      setError("Could not load admin data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    try {
      const rawPersonalisation = localStorage.getItem(LS_PERSONALISATION);
      if (rawPersonalisation) {
        setPersonalisation({ ...DEFAULT_PERSONALISATION, ...JSON.parse(rawPersonalisation) });
      }

      const rawLists = localStorage.getItem(LS_LISTS);
      if (rawLists) {
        setLists(JSON.parse(rawLists));
      } else {
        setLists(services.map((service) => service.name));
      }
    } catch {
      setLists(services.map((service) => service.name));
    }
  }, []);

  const taskTypes = useMemo(() => {
    const set = new Set();
    quotes.forEach((quote) => {
      if (quote.damage_type) {
        set.add(quote.damage_type);
      }
    });
    return Array.from(set);
  }, [quotes]);

  const requestedQuotes = useMemo(
    () =>
      quotes.filter(
        (quote) =>
          quote.item_type === "intake" ||
          ACTIVE_REQUEST_STATUSES.includes(String(quote.status)),
      ),
    [quotes],
  );

  const filteredQuotes = useMemo(() => {
    return quotes.filter((quote) => {
      const status = String(quote.status);

      if (filterStatus === "completed" && status !== "completed") {
        return false;
      }
      if (filterStatus === "pending" && status === "completed") {
        return false;
      }
      if (filterTask !== "all" && quote.damage_type !== filterTask) {
        return false;
      }

      const created = toDate(quote.created_at);
      if (filterFrom && created && created < new Date(`${filterFrom}T00:00:00`)) {
        return false;
      }
      if (filterTo && created && created > new Date(`${filterTo}T23:59:59`)) {
        return false;
      }

      return true;
    });
  }, [quotes, filterStatus, filterTask, filterFrom, filterTo]);

  const accountQuotes = useMemo(() => {
    if (!selectedAccount) {
      return [];
    }
    return quotes
      .filter((quote) => String(quote.client_email || "").toLowerCase() === String(selectedAccount.email || "").toLowerCase())
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [quotes, selectedAccount]);

  const stockTotals = useMemo(() => {
    return stock.reduce(
      (acc, item) => {
        acc.cost += item.boughtFor * item.qty;
        acc.retail += item.soldFor * item.qty;
        return acc;
      },
      { cost: 0, retail: 0 },
    );
  }, [stock]);

  const updatePersonalisation = (patch) => {
    setPersonalisation((current) => ({ ...current, ...patch }));
    setPersonalisationSaved(false);
  };

  const handleLogoFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      updatePersonalisation({ logoUrl: String(reader.result || "") });
    };
    reader.readAsDataURL(file);
  };

  const savePersonalisation = () => {
    try {
      localStorage.setItem(LS_PERSONALISATION, JSON.stringify(personalisation));
      window.dispatchEvent(new Event("nova-brand-change"));
      setPersonalisationSaved(true);
    } catch {
      setPersonalisationSaved(false);
    }
  };

  const resetPersonalisation = () => {
    setPersonalisation(DEFAULT_PERSONALISATION);
    try {
      localStorage.removeItem(LS_PERSONALISATION);
      window.dispatchEvent(new Event("nova-brand-change"));
    } catch {
      // Ignore storage errors.
    }
    if (logoInputRef.current) {
      logoInputRef.current.value = "";
    }
    setPersonalisationSaved(false);
  };

  const persistLists = (nextLists) => {
    setLists(nextLists);
    try {
      localStorage.setItem(LS_LISTS, JSON.stringify(nextLists));
    } catch {
      // Ignore storage errors.
    }
  };

  const handleAddListItem = () => {
    const value = newListItem.trim();
    if (!value) {
      return;
    }
    persistLists([...lists, value]);
    setNewListItem("");
  };

  const handleRemoveListItem = (index) => {
    persistLists(lists.filter((_, itemIndex) => itemIndex !== index));
  };

  useEffect(() => {
    if (!selectedQuote && !selectedAccount) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedQuote, selectedAccount]);

  const openAccountSummary = (account) => {
    setSelectedAccount(account);
    setError("");
  };

  const closeAccountSummary = () => {
    setSelectedAccount(null);
  };

  const openQuoteSummary = (quote) => {
    setSelectedAccount(null);
    setSelectedQuote(quote);
    setAdminNoteDraft(String(quote.admin_note || ""));
    setError("");
  };

  const closeQuoteSummary = () => {
    setSelectedQuote(null);
    setAdminNoteDraft("");
    setIsSavingAdminNote(false);
  };

  const saveAdminNote = async () => {
    if (!selectedQuote) {
      return;
    }

    setIsSavingAdminNote(true);
    setError("");

    try {
      const response = await fetch("/api/admin/quotes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId: selectedQuote.id,
          itemType: selectedQuote.item_type,
          adminNote: adminNoteDraft,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to save admin note.");
      }

      setQuotes((current) =>
        current.map((quote) =>
          quote.id === selectedQuote.id && quote.item_type === selectedQuote.item_type
            ? { ...quote, admin_note: adminNoteDraft }
            : quote,
        ),
      );
      setSelectedQuote((current) =>
        current
          ? { ...current, admin_note: adminNoteDraft }
          : current,
      );
    } catch (noteError) {
      setError(noteError.message || "Failed to save admin note.");
    } finally {
      setIsSavingAdminNote(false);
    }
  };

  const handleToggleAdmin = async (targetClientId, nextIsAdmin) => {
    setAdminUpdateIds((current) => [...current, targetClientId]);

    const previousClients = clients;
    setClients((current) =>
      current.map((clientRow) =>
        clientRow.id === targetClientId
          ? { ...clientRow, is_admin: nextIsAdmin ? 1 : 0 }
          : clientRow,
      ),
    );

    try {
      const response = await fetch("/api/admin/clients", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: targetClientId, isAdmin: nextIsAdmin }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update admin access.");
      }
    } catch (toggleError) {
      setClients(previousClients);
      setError(toggleError.message || "Failed to update admin access.");
    } finally {
      setAdminUpdateIds((current) => current.filter((id) => id !== targetClientId));
    }
  };

  return (
    <main className="min-h-[70vh] bg-slate-950 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-display text-4xl font-bold tracking-wide text-white drop-shadow-[0_0_18px_rgba(34,211,238,0.9)] [text-shadow:0_0_10px_rgba(34,211,238,0.95),0_0_28px_rgba(34,211,238,0.72)] sm:text-5xl">
            Admin Dashboard
          </h1>
          <button
            type="button"
            onClick={loadData}
            className="rounded-md bg-cyan-400 px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-slate-950 transition hover:bg-cyan-300"
          >
            {isLoading ? "Refreshing..." : "Refresh Data"}
          </button>
        </header>

        {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}

        {!error && (
          <div className="mt-8 space-y-8">
            {/* Quotes Requested */}
            <section className={sectionClass}>
              <h2 className={sectionTitleClass}>
                Quotes Requested <span className="text-cyan-300">({requestedQuotes.length})</span>
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                New guest intakes and pending customer quote requests awaiting a response.
              </p>
              <div className="mt-4 overflow-x-auto">
                {requestedQuotes.length === 0 ? (
                  <p className="text-sm text-slate-400">
                    {isLoading ? "Loading..." : "No outstanding quote requests."}
                  </p>
                ) : (
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className={thClass}>Open</th>
                        <th className={thClass}>Customer</th>
                        <th className={thClass}>Reference</th>
                        <th className={thClass}>Task</th>
                        <th className={thClass}>Status</th>
                        <th className={thClass}>Requested</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requestedQuotes.map((quote) => (
                        <tr key={`req-${quote.item_type}-${quote.id}`} className="border-b border-white/5">
                          <td className={tdClass}>
                            <button
                              type="button"
                              onClick={() => openQuoteSummary(quote)}
                              className="rounded-md bg-cyan-400 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-slate-950 transition hover:bg-cyan-300"
                            >
                              View
                            </button>
                          </td>
                          <td className={tdClass}>
                            <button
                              type="button"
                              onClick={() => openQuoteSummary(quote)}
                              className="block text-left"
                            >
                              <span className="block font-semibold text-white underline decoration-cyan-300/70 underline-offset-2">
                                {quote.client_name}
                              </span>
                            </button>
                            {quote.client_email ? (
                              <span className="block text-xs text-slate-400">{quote.client_email}</span>
                            ) : null}
                          </td>
                          <td className={tdClass}>
                            {quote.item_type === "intake" ? quote.reference || "-" : `Q-${quote.id}`}
                          </td>
                          <td className={tdClass}>
                            {quote.item_type === "intake" ? "Guest intake" : quote.damage_type || "-"}
                          </td>
                          <td className={tdClass}>
                            <span className="rounded bg-amber-400/20 px-2 py-0.5 text-[0.65rem] font-bold uppercase text-amber-200">
                              {quote.status || "new"}
                            </span>
                          </td>
                          <td className={tdClass}>{formatDate(quote.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>

            {/* All Quotes with filters */}
            <section className={sectionClass}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className={sectionTitleClass}>
                  All Quotes <span className="text-cyan-300">({filteredQuotes.length})</span>
                </h2>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <label className="text-sm text-slate-200">
                  <span className={fieldLabelClass}>Completed</span>
                  <select
                    value={filterStatus}
                    onChange={(event) => setFilterStatus(event.target.value)}
                    className={controlClass}
                  >
                    <option value="all">All</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Not Completed</option>
                  </select>
                </label>
                <label className="text-sm text-slate-200">
                  <span className={fieldLabelClass}>Date From</span>
                  <input
                    type="date"
                    value={filterFrom}
                    onChange={(event) => setFilterFrom(event.target.value)}
                    className={controlClass}
                  />
                </label>
                <label className="text-sm text-slate-200">
                  <span className={fieldLabelClass}>Date To</span>
                  <input
                    type="date"
                    value={filterTo}
                    onChange={(event) => setFilterTo(event.target.value)}
                    className={controlClass}
                  />
                </label>
                <label className="text-sm text-slate-200">
                  <span className={fieldLabelClass}>Type Of Task</span>
                  <select
                    value={filterTask}
                    onChange={(event) => setFilterTask(event.target.value)}
                    className={controlClass}
                  >
                    <option value="all">All Tasks</option>
                    {taskTypes.map((task) => (
                      <option key={task} value={task}>
                        {task}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setFilterStatus("all");
                    setFilterFrom("");
                    setFilterTo("");
                    setFilterTask("all");
                  }}
                  className="rounded-md border border-white/25 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-white/10"
                >
                  Clear Filters
                </button>
              </div>

              <div className="mt-4 overflow-x-auto">
                {filteredQuotes.length === 0 ? (
                  <p className="text-sm text-slate-400">
                    {isLoading ? "Loading..." : "No quotes match the current filters."}
                  </p>
                ) : (
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className={thClass}>Open</th>
                        <th className={thClass}>Client</th>
                        <th className={thClass}>Task</th>
                        <th className={thClass}>Severity</th>
                        <th className={thClass}>Panels</th>
                        <th className={thClass}>Estimate</th>
                        <th className={thClass}>Status</th>
                        <th className={thClass}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredQuotes.map((quote) => (
                        <tr key={`all-${quote.item_type}-${quote.id}`} className="border-b border-white/5">
                          <td className={tdClass}>
                            <button
                              type="button"
                              onClick={() => openQuoteSummary(quote)}
                              className="rounded-md bg-cyan-400 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-slate-950 transition hover:bg-cyan-300"
                            >
                              View
                            </button>
                          </td>
                          <td className={tdClass}>
                            <button
                              type="button"
                              onClick={() => openQuoteSummary(quote)}
                              className="block text-left"
                            >
                              <span className="block font-semibold text-white underline decoration-cyan-300/70 underline-offset-2">
                                {quote.client_name}
                              </span>
                            </button>
                            {quote.client_email ? (
                              <span className="block text-xs text-slate-400">{quote.client_email}</span>
                            ) : null}
                            {quote.item_type === "intake" ? (
                              <span className="block text-xs text-emerald-300">
                                Ref: {quote.reference || "-"} | Reg: {quote.registration || "-"}
                              </span>
                            ) : null}
                          </td>
                          <td className={tdClass}>{quote.damage_type || (quote.item_type === "intake" ? "Guest intake" : "-")}</td>
                          <td className={tdClass}>{quote.severity || "-"}</td>
                          <td className={tdClass}>{quote.panels || "-"}</td>
                          <td className={tdClass}>
                            {quote.item_type === "intake"
                              ? "-"
                              : `GBP ${quote.estimate_low} - ${quote.estimate_high}`}
                          </td>
                          <td className={tdClass}>{quote.status || "-"}</td>
                          <td className={tdClass}>{formatDate(quote.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>

            {/* Customer Accounts */}
            <section className={sectionClass}>
              <h2 className={sectionTitleClass}>
                Customer Accounts <span className="text-cyan-300">({clients.length})</span>
              </h2>
              <div className="mt-4 overflow-x-auto">
                {clients.length === 0 ? (
                  <p className="text-sm text-slate-400">
                    {isLoading ? "Loading..." : "No customer accounts yet."}
                  </p>
                ) : (
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className={thClass}>Open</th>
                        <th className={thClass}>Name</th>
                        <th className={thClass}>Address</th>
                        <th className={thClass}>Postcode</th>
                        <th className={thClass}>County</th>
                        <th className={thClass}>Admin Access</th>
                        <th className={thClass}>Active Request</th>
                        <th className={thClass}>Pending Work</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clients.map((row) => {
                        const activeRequest = quotes.some(
                          (quote) =>
                            quote.client_email === row.email &&
                            ACTIVE_REQUEST_STATUSES.includes(String(quote.status)),
                        );
                        const pendingWork = quotes.some(
                          (quote) =>
                            quote.client_email === row.email &&
                            PENDING_WORK_STATUSES.includes(String(quote.status)),
                        );
                        const postcode =
                          quotes.find((quote) => quote.client_email === row.email && quote.postcode)
                            ?.postcode || "-";
                        const isLockedOwner = String(row.email || "").toLowerCase() === "quantuzgoo@gmail.com";
                        const isUpdatingAdmin = adminUpdateIds.includes(row.id);

                        return (
                          <tr key={row.id} className="border-b border-white/5">
                            <td className={tdClass}>
                              <button
                                type="button"
                                onClick={() => openAccountSummary(row)}
                                className="rounded-md bg-cyan-400 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-slate-950 transition hover:bg-cyan-300"
                              >
                                View
                              </button>
                            </td>
                            <td className={tdClass}>
                              <button
                                type="button"
                                onClick={() => openAccountSummary(row)}
                                className="block text-left"
                              >
                                <span className="font-semibold text-white underline decoration-cyan-300/70 underline-offset-2">{row.name}</span>
                              </button>
                              {Boolean(row.is_admin) && (
                                <span className="ml-2 rounded bg-cyan-400/20 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase text-cyan-300">
                                  Admin
                                </span>
                              )}
                              <span className="block text-xs text-slate-400">{row.email}</span>
                            </td>
                            <td className={tdClass}>-</td>
                            <td className={tdClass}>{postcode}</td>
                            <td className={tdClass}>-</td>
                            <td className={tdClass}>
                              <label className="inline-flex items-center gap-2 text-xs text-slate-300">
                                <input
                                  type="checkbox"
                                  checked={Boolean(row.is_admin)}
                                  disabled={!canManageAdmins || isLockedOwner || isUpdatingAdmin}
                                  onChange={(event) =>
                                    handleToggleAdmin(row.id, event.target.checked)
                                  }
                                  className="h-4 w-4 rounded border-white/25 bg-slate-950"
                                />
                                {isUpdatingAdmin ? "Saving..." : "Admin"}
                              </label>
                            </td>
                            <td className={tdClass}>
                              <span
                                className={`rounded px-2 py-0.5 text-[0.65rem] font-bold uppercase ${
                                  activeRequest
                                    ? "bg-emerald-400/20 text-emerald-200"
                                    : "bg-slate-700/40 text-slate-400"
                                }`}
                              >
                                {activeRequest ? "Yes" : "No"}
                              </span>
                            </td>
                            <td className={tdClass}>
                              <span
                                className={`rounded px-2 py-0.5 text-[0.65rem] font-bold uppercase ${
                                  pendingWork
                                    ? "bg-amber-400/20 text-amber-200"
                                    : "bg-slate-700/40 text-slate-400"
                                }`}
                              >
                                {pendingWork ? "Yes" : "No"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </section>

            {/* Stock */}
            <section className={sectionClass}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className={sectionTitleClass}>
                  Stock <span className="text-cyan-300">({stock.length})</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Stock cost {formatMoney(stockTotals.cost)} | Retail value {formatMoney(stockTotals.retail)}
                </p>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className={thClass}>Item</th>
                      <th className={thClass}>Unit</th>
                      <th className={thClass}>Qty</th>
                      <th className={thClass}>Bought / Unit</th>
                      <th className={thClass}>Sold / Unit</th>
                      <th className={thClass}>Margin / Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stock.map((item) => (
                      <tr key={item.id} className="border-b border-white/5">
                        <td className={tdClass}>{item.name}</td>
                        <td className={tdClass}>{item.unit}</td>
                        <td className={tdClass}>{item.qty}</td>
                        <td className={tdClass}>{formatMoney(item.boughtFor)}</td>
                        <td className={tdClass}>{formatMoney(item.soldFor)}</td>
                        <td className={tdClass}>
                          <span className="font-semibold text-emerald-300">
                            {formatMoney(item.soldFor - item.boughtFor)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Personalisation */}
            <section className={sectionClass}>
              <h2 className={sectionTitleClass}>Website Personalisation</h2>
              <p className="mt-1 text-sm text-slate-400">
                Upload your own logo and set the brand colours used across the website.
              </p>

              <div className="mt-4 grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <span className={fieldLabelClass}>Brand Name</span>
                    <input
                      type="text"
                      value={personalisation.brandText}
                      onChange={(event) => updatePersonalisation({ brandText: event.target.value })}
                      placeholder="NOVA BODYWORKS"
                      className={controlClass}
                    />
                  </div>

                  <div>
                    <span className={fieldLabelClass}>Logo Image</span>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoFile}
                      className={`${controlClass} file:mr-3 file:rounded file:border-0 file:bg-cyan-400 file:px-3 file:py-1 file:text-xs file:font-bold file:text-slate-950`}
                    />
                    {personalisation.logoUrl ? (
                      <button
                        type="button"
                        onClick={() => {
                          updatePersonalisation({ logoUrl: "" });
                          if (logoInputRef.current) {
                            logoInputRef.current.value = "";
                          }
                        }}
                        className="mt-2 text-xs font-semibold text-rose-300 hover:text-rose-200"
                      >
                        Remove logo image
                      </button>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className={fieldLabelClass}>Primary Colour</span>
                      <input
                        type="color"
                        value={personalisation.primaryColor}
                        onChange={(event) => updatePersonalisation({ primaryColor: event.target.value })}
                        className="mt-1 h-10 w-full cursor-pointer rounded-md border border-white/15 bg-slate-950"
                      />
                    </div>
                    <div>
                      <span className={fieldLabelClass}>Accent Colour</span>
                      <input
                        type="color"
                        value={personalisation.accentColor}
                        onChange={(event) => updatePersonalisation({ accentColor: event.target.value })}
                        className="mt-1 h-10 w-full cursor-pointer rounded-md border border-white/15 bg-slate-950"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={savePersonalisation}
                      className="rounded-md bg-cyan-400 px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-slate-950 transition hover:bg-cyan-300"
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={resetPersonalisation}
                      className="rounded-md border border-white/25 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-white/10"
                    >
                      Reset To Default
                    </button>
                    {personalisationSaved && (
                      <span className="text-xs font-semibold text-emerald-300">Saved.</span>
                    )}
                  </div>
                </div>

                <div
                  className="flex flex-col items-start justify-center gap-4 rounded-xl border border-white/10 p-6"
                  style={{ backgroundColor: personalisation.primaryColor }}
                >
                  <span className={fieldLabelClass}>Live Preview</span>
                  {personalisation.logoUrl ? (
                    <img
                      src={personalisation.logoUrl}
                      alt="Logo preview"
                      className="h-12 w-auto"
                    />
                  ) : (
                    <span className="font-display text-2xl font-bold tracking-wider text-white">
                      {(personalisation.brandText || "NOVA BODYWORKS").split(" ")[0]}
                      <span className="ml-2" style={{ color: personalisation.accentColor }}>
                        {(personalisation.brandText || "NOVA BODYWORKS").split(" ").slice(1).join(" ")}
                      </span>
                    </span>
                  )}
                  <button
                    type="button"
                    className="rounded-md px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-slate-950"
                    style={{ backgroundColor: personalisation.accentColor }}
                  >
                    Sample Button
                  </button>
                </div>
              </div>
            </section>

            {/* Manage Lists */}
            <section className={sectionClass}>
              <h2 className={sectionTitleClass}>
                Manage Website Lists <span className="text-cyan-300">({lists.length})</span>
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Edit the service list shown across the website.
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                <input
                  type="text"
                  value={newListItem}
                  onChange={(event) => setNewListItem(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleAddListItem();
                    }
                  }}
                  placeholder="Add a new list item"
                  className={`${controlClass} max-w-md flex-1`}
                />
                <button
                  type="button"
                  onClick={handleAddListItem}
                  className="rounded-md bg-cyan-400 px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-slate-950 transition hover:bg-cyan-300"
                >
                  Add Item
                </button>
              </div>

              <ul className="mt-4 space-y-2">
                {lists.length === 0 ? (
                  <li className="text-sm text-slate-400">No list items yet.</li>
                ) : (
                  lists.map((item, index) => (
                    <li
                      key={`${item}-${index}`}
                      className="flex items-center justify-between rounded-md border border-white/10 bg-slate-950/60 px-3 py-2"
                    >
                      <span className="text-sm text-slate-200">{item}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveListItem(index)}
                        className="text-xs font-semibold text-rose-300 hover:text-rose-200"
                      >
                        Remove
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </section>
          </div>
        )}
      </div>

      {selectedAccount && (
        <div
          className="fixed inset-0 z-[88] grid place-items-center overflow-hidden bg-slate-950/80 px-4 py-8"
          role="dialog"
          aria-modal="true"
          aria-label="Customer account summary"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeAccountSummary();
            }
          }}
        >
          <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-2xl border border-white/15 bg-slate-900 p-6 shadow-2xl shadow-cyan-950/40">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-2xl font-bold text-white">Customer Account</h3>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-cyan-300">{selectedAccount.name}</p>
              </div>
              <button
                type="button"
                onClick={closeAccountSummary}
                className="rounded-md border border-white/25 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-white/10"
              >
                Close
              </button>
            </div>

            <div className="modal-scroll-area mt-5 overflow-y-auto overscroll-contain pr-1">
              <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                <section className="rounded-xl border border-white/10 bg-slate-950/70 p-4">
                  <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-300">Customer Details</h4>
                  <dl className="mt-3 space-y-2 text-sm text-slate-200">
                    <div>
                      <dt className="text-xs uppercase tracking-[0.12em] text-slate-400">Name</dt>
                      <dd className="font-semibold text-white">{selectedAccount.name || "-"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-[0.12em] text-slate-400">Full Address</dt>
                      <dd>
                        {formatFullAddress(
                          selectedAccount.address_line1,
                          selectedAccount.address_line2,
                          selectedAccount.county,
                          selectedAccount.postcode,
                        ) || "-"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-[0.12em] text-slate-400">Contact Number</dt>
                      <dd>{selectedAccount.phone || "-"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-[0.12em] text-slate-400">Email</dt>
                      <dd>{selectedAccount.email || "-"}</dd>
                    </div>
                  </dl>
                </section>

                <section className="rounded-xl border border-white/10 bg-slate-950/70 p-4">
                  <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-300">
                    Quotes For This Account ({accountQuotes.length})
                  </h4>
                  <div className="mt-3 overflow-x-auto">
                    {accountQuotes.length === 0 ? (
                      <p className="text-sm text-slate-400">No quotes found for this account.</p>
                    ) : (
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className={thClass}>Open</th>
                            <th className={thClass}>Task</th>
                            <th className={thClass}>Status</th>
                            <th className={thClass}>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {accountQuotes.map((quote) => {
                            const isCompleted = String(quote.status || "") === "completed";
                            return (
                              <tr key={`acct-${quote.item_type}-${quote.id}`} className="border-b border-white/5">
                                <td className={tdClass}>
                                  <button
                                    type="button"
                                    onClick={() => openQuoteSummary(quote)}
                                    className="rounded-md bg-cyan-400 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-slate-950 transition hover:bg-cyan-300"
                                  >
                                    View
                                  </button>
                                </td>
                                <td className={tdClass}>{quote.damage_type || (quote.item_type === "intake" ? "Guest intake" : "-")}</td>
                                <td className={tdClass}>
                                  <span
                                    className={`rounded px-2 py-0.5 text-[0.65rem] font-bold uppercase ${
                                      isCompleted
                                        ? "bg-emerald-400/20 text-emerald-200"
                                        : "bg-amber-400/20 text-amber-200"
                                    }`}
                                  >
                                    {isCompleted ? "Completed" : "Active"}
                                  </span>
                                </td>
                                <td className={tdClass}>{formatDate(quote.created_at)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedQuote && (
        <div
          className="fixed inset-0 z-[90] grid place-items-center overflow-hidden bg-slate-950/80 px-4 py-8"
          role="dialog"
          aria-modal="true"
          aria-label="Quote summary"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeQuoteSummary();
            }
          }}
        >
          <div
            className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-2xl border border-white/15 bg-slate-900 p-6 shadow-2xl shadow-cyan-950/40"
            onWheel={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-2xl font-bold text-white">Quote Details</h3>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-cyan-300">
                  {selectedQuote.item_type === "intake" ? "Guest Quote Intake" : "Customer Quote"} #{selectedQuote.id}
                </p>
              </div>
              <button
                type="button"
                onClick={closeQuoteSummary}
                className="rounded-md border border-white/25 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-white/10"
              >
                Close
              </button>
            </div>

            <div className="modal-scroll-area mt-5 overflow-y-auto overscroll-contain pr-1">
              <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
              <section className="rounded-xl border border-white/10 bg-slate-950/70 p-4">
                <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-300">Requested By</h4>
                <dl className="mt-3 space-y-2 text-sm text-slate-200">
                  <div>
                    <dt className="text-xs uppercase tracking-[0.12em] text-slate-400">Name</dt>
                    <dd className="font-semibold text-white">
                      {selectedQuote.intake_name || selectedQuote.client_name || "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.12em] text-slate-400">Full Address</dt>
                    <dd>
                      {formatFullAddress(
                        selectedQuote.intake_address_line1 || selectedQuote.client_address_line1,
                        selectedQuote.intake_address_line2 || selectedQuote.client_address_line2,
                        selectedQuote.intake_county || selectedQuote.client_county,
                        selectedQuote.postcode || selectedQuote.client_postcode,
                      ) || "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.12em] text-slate-400">Contact Number</dt>
                    <dd>{selectedQuote.intake_phone || selectedQuote.client_phone || "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.12em] text-slate-400">Email</dt>
                    <dd>{selectedQuote.client_email || "-"}</dd>
                  </div>
                </dl>
              </section>

              <section className="rounded-xl border border-white/10 bg-slate-950/70 p-4">
                <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-300">Quote Summary / Other Info</h4>
                <div className="mt-3 rounded-md border border-white/10 bg-slate-900/70 p-3 text-sm text-slate-200">
                  <p><span className="text-slate-400">Reference:</span> {selectedQuote.reference || `Q-${selectedQuote.id}`}</p>
                  <p><span className="text-slate-400">Task:</span> {selectedQuote.damage_type || "Guest intake"}</p>
                  <p><span className="text-slate-400">Severity:</span> {selectedQuote.severity || "-"}</p>
                  <p><span className="text-slate-400">Panels:</span> {selectedQuote.panels || "-"}</p>
                  <p><span className="text-slate-400">Registration:</span> {selectedQuote.registration || "-"}</p>
                  <p><span className="text-slate-400">Postcode:</span> {selectedQuote.postcode || "-"}</p>
                  <p><span className="text-slate-400">Preferred Contact:</span> {selectedQuote.contact_methods || "-"}</p>
                  <p>
                    <span className="text-slate-400">Estimate:</span>{" "}
                    {selectedQuote.item_type === "intake"
                      ? "-"
                      : `GBP ${selectedQuote.estimate_low} - ${selectedQuote.estimate_high}`}
                  </p>
                  <p><span className="text-slate-400">Status:</span> {selectedQuote.status || "-"}</p>
                  <p><span className="text-slate-400">Created:</span> {formatDate(selectedQuote.created_at)}</p>
                </div>
                <div className="mt-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Other info from quote</p>
                  <div className="mt-1 min-h-20 rounded-md border border-white/10 bg-slate-900/70 p-3 text-sm text-slate-200 whitespace-pre-wrap">
                    {selectedQuote.other_details || "-"}
                  </div>
                </div>
              </section>
              </div>

              <section className="mt-4 rounded-xl border border-white/10 bg-slate-950/70 p-4">
                <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-300">Admin Notes</h4>
                <textarea
                  value={adminNoteDraft}
                  onChange={(event) => setAdminNoteDraft(event.target.value)}
                  rows={5}
                  placeholder="Type internal admin notes for this quote"
                  className="mt-2 block w-full rounded-md border border-white/15 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500"
                />
                <div className="mt-3 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={saveAdminNote}
                    disabled={isSavingAdminNote}
                    className="rounded-md bg-cyan-400 px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSavingAdminNote ? "Saving..." : "Save Admin Note"}
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
