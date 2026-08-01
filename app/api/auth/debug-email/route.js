import { runEmailDiagnostics } from "@/lib/email";
import crypto from "node:crypto";

// Diagnostic endpoint. Gated behind SMTP_DEBUG so it can't be probed in normal production.
// GET/POST /api/auth/debug-email            -> verifies SMTP connection/credentials (captures transcript)
// GET/POST /api/auth/debug-email?to=x@y.z   -> also sends a test email and returns the full SMTP transcript
async function handle(request, to) {
  if (!/^(1|true|yes)$/i.test(String(process.env.SMTP_DEBUG || ""))) {
    return Response.json(
      { enabled: false, error: "Email debugging is disabled. Set SMTP_DEBUG=true and restart." },
      { status: 404 },
    );
  }

  const cleanTo = String(to || "").trim().toLowerCase();
  if (cleanTo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanTo)) {
    return Response.json({ enabled: true, error: "Invalid 'to' email address." }, { status: 400 });
  }

  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = request.headers.get("host");
  const protocol = forwardedProto || (host && host.includes("localhost") ? "http" : "https");
  const baseUrl = forwardedHost ? `${protocol}://${forwardedHost}` : host ? `${protocol}://${host}` : undefined;

  const token = crypto.randomBytes(16).toString("hex");
  const result = await runEmailDiagnostics({ to: cleanTo || undefined, token, baseUrl });

  return Response.json({ enabled: true, ...result });
}

export async function GET(request) {
  const url = new URL(request.url);
  return handle(request, url.searchParams.get("to"));
}

export async function POST(request) {
  let body = {};
  try {
    body = await request.json();
  } catch {
    // no body is fine — verify only
  }
  return handle(request, body?.to);
}

