"use client";

import { useState } from "react";

const box = {
  maxWidth: 860,
  margin: "40px auto",
  padding: "0 20px",
  fontFamily: "system-ui, Arial, sans-serif",
  color: "#e6e6e6",
};

const pre = {
  background: "#0b0f16",
  color: "#c7f0d8",
  padding: 16,
  borderRadius: 8,
  overflowX: "auto",
  fontSize: 13,
  lineHeight: 1.5,
  border: "1px solid #1e2a3a",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
};

function Badge({ ok, label }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        background: ok ? "#0f5132" : "#842029",
        color: ok ? "#d1e7dd" : "#f8d7da",
      }}
    >
      {label}
    </span>
  );
}

export default function DebugEmailPage() {
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function run(sendTest) {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/auth/debug-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sendTest ? { to } : {}),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || `Request failed (${response.status}).`);
        setResult(data);
      } else {
        setResult(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const buttonStyle = {
    padding: "10px 18px",
    borderRadius: 8,
    border: "none",
    fontWeight: 600,
    cursor: loading ? "not-allowed" : "pointer",
    opacity: loading ? 0.6 : 1,
  };

  return (
    <main style={box}>
      <h1 style={{ marginBottom: 4 }}>SMTP / Email Debug</h1>
      <p style={{ color: "#9aa4b2", marginTop: 0 }}>
        Requires <code>SMTP_DEBUG=true</code> on the server. Verifies the SMTP connection and can send a
        test email, showing the full SMTP transcript below.
      </p>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", margin: "20px 0" }}>
        <input
          type="email"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="you@example.com"
          style={{
            flex: "1 1 260px",
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #33415a",
            background: "#111827",
            color: "#e6e6e6",
          }}
        />
        <button onClick={() => run(false)} disabled={loading} style={{ ...buttonStyle, background: "#374151", color: "#fff" }}>
          {loading ? "Working…" : "Verify connection"}
        </button>
        <button
          onClick={() => run(true)}
          disabled={loading || !to}
          style={{ ...buttonStyle, background: "#2563eb", color: "#fff" }}
        >
          {loading ? "Working…" : "Send test email"}
        </button>
      </div>

      {error && (
        <div style={{ background: "#842029", color: "#f8d7da", padding: 12, borderRadius: 8, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {result && result.config && (
        <>
          <h3>Configuration</h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
            <Badge ok={result.config.configured} label={result.config.configured ? "SMTP configured" : "SMTP NOT configured"} />
            {result.verify && (
              <Badge ok={result.verify.ok} label={result.verify.ok ? "Connection OK" : "Connection FAILED"} />
            )}
            {result.testSend && (
              <Badge ok={result.testSend.sent} label={result.testSend.sent ? "Test email sent" : "Send FAILED"} />
            )}
          </div>
          <pre style={pre}>
{`host:   ${result.config.host}:${result.config.port} (secure=${result.config.secure})
user:   ${result.config.user || "—"}
from:   ${result.config.from || "—"}
verify: ${result.verify?.ok ? "OK" : `FAILED — ${result.verify?.reason || ""}`}${
              result.testSend
                ? `
send:   ${
                    result.testSend.sent
                      ? `OK — messageId=${result.testSend.messageId}
        response=${result.testSend.response}
        accepted=${JSON.stringify(result.testSend.accepted)} rejected=${JSON.stringify(result.testSend.rejected)}`
                      : `FAILED — ${result.testSend.reason}`
                  }`
                : ""
            }`}
          </pre>
        </>
      )}

      {result && Array.isArray(result.transcript) && result.transcript.length > 0 && (
        <>
          <h3>SMTP Transcript</h3>
          <pre style={pre}>{result.transcript.join("\n")}</pre>
        </>
      )}
    </main>
  );
}
