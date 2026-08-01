import crypto from "node:crypto";
import { getDb } from "@/lib/db";
import { sendLoginLinkEmail } from "@/lib/email";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = String(body?.email || "").trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const db = getDb();
  const client = db
    .prepare("SELECT id, email FROM clients WHERE email = ?")
    .get(email);

  if (!client) {
    return Response.json({
      sent: true,
      message: "If this email is registered, a sign-in link has been sent.",
    });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  db.prepare("INSERT INTO login_links (token, client_id, expires_at) VALUES (?, ?, ?)").run(
    token,
    Number(client.id),
    expiresAt,
  );

  const configuredBaseUrl = String(process.env.APP_BASE_URL || "").trim();
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = request.headers.get("host");
  const protocol = forwardedProto || (host && host.includes("localhost") ? "http" : "https");
  const detectedBaseUrl = forwardedHost
    ? `${protocol}://${forwardedHost}`
    : host
      ? `${protocol}://${host}`
      : "http://localhost:3004";
  const baseUrl = configuredBaseUrl || detectedBaseUrl;

  const emailResult = await sendLoginLinkEmail({ to: client.email, token, baseUrl });
  if (!emailResult.sent) {
    return Response.json({ error: emailResult.reason }, { status: 503 });
  }

  return Response.json({
    sent: true,
    message: "Check your inbox for your secure sign-in link.",
  });
}
