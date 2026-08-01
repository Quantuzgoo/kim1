"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

const LOGIN_COMPLETE_KEY = "nova-login-complete";
const LOGIN_COMPLETE_CHANNEL = "nova-login-complete";
// Cleared automatically when the browser/tab is closed, so a restored session is forced to log out.
const SESSION_ACTIVE_KEY = "nova-session-active";

const inputClass =
  "mt-1 block w-full rounded-md border border-white/15 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500";

export default function AccountMenu() {
  const [client, setClient] = useState(null);
  const [isChecked, setIsChecked] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("login") === "success") {
      sessionStorage.setItem(SESSION_ACTIVE_KEY, "1");
    }

    const check = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();

        if (!data.client) {
          setClient(null);
          return;
        }

        if (sessionStorage.getItem(SESSION_ACTIVE_KEY)) {
          setClient(data.client);
        } else {
          // Session cookie survived a browser restart; force logout.
          await fetch("/api/auth/logout", { method: "POST" });
          setClient(null);
        }
      } catch {
        setClient(null);
      } finally {
        setIsChecked(true);
      }
    };

    check();
  }, []);

  useEffect(() => {
    const handleLoginComplete = () => {
      if (!isModalOpen || mode !== "login") {
        return;
      }

      sessionStorage.setItem(SESSION_ACTIVE_KEY, "1");
      closeModal();
      window.location.assign("/account");
    };

    const onStorage = (event) => {
      if (event.key === LOGIN_COMPLETE_KEY && event.newValue) {
        handleLoginComplete();
      }
    };

    window.addEventListener("storage", onStorage);

    let channel = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      channel = new BroadcastChannel(LOGIN_COMPLETE_CHANNEL);
      channel.onmessage = () => {
        handleLoginComplete();
      };
    }

    return () => {
      window.removeEventListener("storage", onStorage);
      if (channel) {
        channel.close();
      }
    };
  }, [isModalOpen, mode]);

  const closeModal = () => {
    setIsModalOpen(false);
    setError("");
    setNotice("");
    setPassword("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setIsSubmitting(true);

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload = mode === "login" ? { email } : { name, email, password };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const contentType = response.headers.get("content-type") || "";
      const isJson = contentType.includes("application/json");
      const data = isJson ? await response.json() : null;

      if (!response.ok) {
        const statusPrefix = `Request failed (${response.status}).`;
        const bodyError = data?.error;
        setError(bodyError ? `${statusPrefix} ${bodyError}` : `${statusPrefix} Please try again.`);
        return;
      }

      if (mode === "login") {
        setNotice(data.message || "Check your email for your secure sign-in link.");
        return;
      }

      setClient(data.client);
      sessionStorage.setItem(SESSION_ACTIVE_KEY, "1");
      closeModal();
      window.location.reload();
    } catch (error) {
      const reason = error instanceof Error && error.message ? ` (${error.message})` : "";
      setError(`Could not reach the server${reason}. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    sessionStorage.removeItem(SESSION_ACTIVE_KEY);
    setClient(null);
    window.location.reload();
  };

  if (!isChecked) {
    return (
      <span className="rounded-md bg-cyan-400/40 px-4 py-2 text-xs font-extrabold tracking-wide text-slate-950 sm:text-sm">
        ...
      </span>
    );
  }

  if (client) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/account"
          className="rounded-md bg-cyan-400 px-4 py-2 text-xs font-extrabold tracking-wide text-slate-950 transition hover:bg-cyan-300 sm:text-sm"
        >
          My Account
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-md border border-white/25 px-4 py-2 text-xs font-extrabold tracking-wide text-white transition hover:bg-white/10 sm:text-sm"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="rounded-md bg-cyan-400 px-4 py-2 text-xs font-extrabold tracking-wide text-slate-950 transition hover:bg-cyan-300 sm:text-sm"
      >
        Login
      </button>

      {isModalOpen &&
        createPortal(
          <div
          className="fixed left-0 top-0 z-[80] grid h-dvh w-dvw place-items-center bg-slate-950/80 px-4"
          role="dialog"
          aria-modal="true"
          aria-label={mode === "login" ? "Login" : "Create account"}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-slate-900 p-6 shadow-2xl shadow-cyan-950/40">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold text-white">
                {mode === "login" ? "Login" : "Create Account"}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Close"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/40 text-white transition hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              {mode === "register" && (
                <label className="block text-sm text-slate-200">
                  Name
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                    maxLength={100}
                    placeholder="Your name"
                    className={inputClass}
                  />
                </label>
              )}

              <label className="block text-sm text-slate-200">
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  placeholder="you@example.com"
                  className={inputClass}
                />
              </label>

              {mode === "register" && (
                <label className="block text-sm text-slate-200">
                  Password
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    minLength={8}
                    placeholder="At least 8 characters"
                    className={inputClass}
                  />
                </label>
              )}

              {error && <p className="text-sm text-rose-300">{error}</p>}
              {notice && <p className="text-sm text-emerald-300">{notice}</p>}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-md bg-cyan-400 px-4 py-2 text-sm font-extrabold tracking-wide text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting
                  ? "Please wait..."
                  : mode === "login"
                    ? "Send Login Link"
                    : "Create Account"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode(mode === "login" ? "register" : "login");
                  setError("");
                  setNotice("");
                  setPassword("");
                }}
                className="w-full rounded-md border border-white/25 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10"
              >
                {mode === "login" ? "Register" : "Back to Login"}
              </button>
            </form>
          </div>
        </div>,
          document.body,
        )}
    </>
  );
}
