import crypto from "node:crypto";
import { cookies } from "next/headers";
import { getDb } from "./db";

export const SESSION_COOKIE = "nova_session";
const SESSION_DAYS = 30;
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
};

export async function createSession(clientId) {
  const db = getDb();
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  db.prepare("INSERT INTO sessions (token, client_id, expires_at) VALUES (?, ?, ?)").run(
    token,
    clientId,
    expiresAt,
  );

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS);
}

export async function getSessionClient() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  const db = getDb();
  const client = db
    .prepare(
      `SELECT c.id, c.name, c.email, c.is_admin
       FROM sessions s
       JOIN clients c ON c.id = s.client_id
       WHERE s.token = ? AND s.expires_at > ?`,
    )
    .get(token, new Date().toISOString());

  if (client) {
    cookieStore.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS);
  }

  return client || null;
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    getDb().prepare("DELETE FROM sessions WHERE token = ?").run(token);
  }

  cookieStore.delete(SESSION_COOKIE);
}
