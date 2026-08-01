import { getDb } from "@/lib/db";
import { createSession } from "@/lib/auth";

export async function GET(request) {
  const url = new URL(request.url);
  const configuredBaseUrl = String(process.env.APP_BASE_URL || "").trim().replace(/\/$/, "");
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

  const redirectTo = (path) => Response.redirect(new URL(path, `${baseUrl}/`), 302);

  const token = String(url.searchParams.get("token") || "").trim();

  if (!token) {
    return redirectTo("/?login=invalid");
  }

  const db = getDb();
  const row = db
    .prepare(
      `SELECT token, client_id, expires_at, used_at
       FROM login_links
       WHERE token = ?`,
    )
    .get(token);

  if (!row) {
    return redirectTo("/?login=invalid");
  }

  if (row.used_at || row.expires_at <= new Date().toISOString()) {
    return redirectTo("/?login=expired");
  }

  db.prepare("UPDATE login_links SET used_at = datetime('now') WHERE token = ?").run(token);
  await createSession(Number(row.client_id));

  return redirectTo("/account?login=success");
}
