"use client";

import { useEffect } from "react";

const LOGIN_COMPLETE_KEY = "nova-login-complete";
const LOGIN_COMPLETE_CHANNEL = "nova-login-complete";

export default function LoginCompletePage() {
  useEffect(() => {
    const payload = String(Date.now());

    try {
      localStorage.setItem(LOGIN_COMPLETE_KEY, payload);
    } catch {
      // Ignore localStorage errors in restricted/private contexts.
    }

    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const channel = new BroadcastChannel(LOGIN_COMPLETE_CHANNEL);
      channel.postMessage(payload);
      channel.close();
    }

    // Try to close the handoff tab after signaling the original tab.
    try {
      window.open("", "_self");
    } catch {
      // Ignore close preparation failures.
    }

    try {
      window.close();
    } catch {
      // Ignore close failures.
    }

    setTimeout(() => {
      try {
        window.close();
      } catch {
        // Ignore close failures.
      }
    }, 120);
  }, []);

  return (
    <main className="grid min-h-[50vh] place-items-center bg-slate-950 px-4 py-16 text-slate-300">
      <p>Completing secure sign in...</p>
    </main>
  );
}
