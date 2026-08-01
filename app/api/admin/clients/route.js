import { getDb } from "@/lib/db";
import { getSessionClient } from "@/lib/auth";

export async function GET() {
  const client = await getSessionClient();
  if (!client || !client.is_admin) {
    return Response.json({ error: "Admin access required." }, { status: 403 });
  }

  const canManageAdmins = String(client.email || "").toLowerCase() === "quantuzgoo@gmail.com";

  const clients = getDb()
    .prepare(
      `SELECT c.id, c.name, c.email, c.phone, c.address_line1, c.address_line2, c.county, c.postcode, c.is_admin, c.created_at,
              (SELECT COUNT(*) FROM quotes q WHERE q.client_id = c.id) AS quote_count,
              (SELECT COUNT(*) FROM photos p WHERE p.client_id = c.id) AS photo_count
       FROM clients c
       ORDER BY c.created_at DESC`,
    )
    .all();

  return Response.json({ clients, canManageAdmins });
}

export async function PATCH(request) {
  const client = await getSessionClient();
  if (!client || !client.is_admin) {
    return Response.json({ error: "Admin access required." }, { status: 403 });
  }

  const canManageAdmins = String(client.email || "").toLowerCase() === "quantuzgoo@gmail.com";
  if (!canManageAdmins) {
    return Response.json({ error: "Only quantuzgoo@gmail.com can manage admin access." }, { status: 403 });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const clientId = Number(payload?.clientId);
  const isAdmin = Boolean(payload?.isAdmin);

  if (!Number.isInteger(clientId) || clientId <= 0) {
    return Response.json({ error: "A valid clientId is required." }, { status: 400 });
  }

  const db = getDb();
  const target = db
    .prepare("SELECT id, email FROM clients WHERE id = ?")
    .get(clientId);

  if (!target) {
    return Response.json({ error: "Client not found." }, { status: 404 });
  }

  if (String(target.email || "").toLowerCase() === "quantuzgoo@gmail.com") {
    return Response.json({ error: "quantuzgoo@gmail.com admin access cannot be changed." }, { status: 400 });
  }

  db.prepare("UPDATE clients SET is_admin = ? WHERE id = ?").run(isAdmin ? 1 : 0, clientId);

  return Response.json({ ok: true });
}
