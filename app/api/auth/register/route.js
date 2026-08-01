import { getDb, hashPassword } from "@/lib/db";
import { createSession } from "@/lib/auth";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = String(body?.name || "").trim();
  const email = String(body?.email || "").trim().toLowerCase();
  const password = String(body?.password || "");

  if (!name || name.length > 100) {
    return Response.json({ error: "Please enter your name." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (password.length < 8) {
    return Response.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const db = getDb();
  const existing = db.prepare("SELECT id FROM clients WHERE email = ?").get(email);
  if (existing) {
    return Response.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  const result = db
    .prepare("INSERT INTO clients (name, email, password_hash) VALUES (?, ?, ?)")
    .run(name, email, hashPassword(password));

  await createSession(Number(result.lastInsertRowid));

  return Response.json({ client: { name, email, isAdmin: false } }, { status: 201 });
}
