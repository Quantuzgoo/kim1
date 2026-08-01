import { getDb } from "@/lib/db";
import { getSessionClient } from "@/lib/auth";

export async function GET() {
  const client = await getSessionClient();
  if (!client || !client.is_admin) {
    return Response.json({ error: "Admin access required." }, { status: 403 });
  }

  const quotes = getDb()
    .prepare(
        `SELECT q.id,
      'quote' AS item_type,
      q.damage_type,
      q.severity,
      q.panels,
      q.registration,
      q.postcode,
      q.contact_methods,
      q.other_details,
      q.admin_note,
      q.estimate_low,
      q.estimate_high,
      q.status,
      q.created_at,
      c.name AS client_name,
      c.email AS client_email,
      c.phone AS client_phone,
      c.address_line1 AS client_address_line1,
      c.address_line2 AS client_address_line2,
      c.county AS client_county,
      c.postcode AS client_postcode,
      '' AS reference,
      '' AS intake_name,
      '' AS intake_phone,
      '' AS intake_address_line1,
      '' AS intake_address_line2,
      '' AS intake_county
    FROM quotes q
    JOIN clients c ON c.id = q.client_id
    UNION ALL
    SELECT qi.id,
      'intake' AS item_type,
      '' AS damage_type,
      '' AS severity,
      0 AS panels,
      qi.registration,
      qi.postcode,
      '' AS contact_methods,
      qi.other_details,
      qi.admin_note,
      0 AS estimate_low,
      0 AS estimate_high,
      qi.status,
      qi.created_at,
      'Guest Quote' AS client_name,
      qi.email AS client_email,
      qi.phone AS client_phone,
      qi.address_line1 AS client_address_line1,
      qi.address_line2 AS client_address_line2,
      qi.county AS client_county,
      qi.postcode AS client_postcode,
      qi.reference,
      qi.name AS intake_name,
      qi.phone AS intake_phone,
      qi.address_line1 AS intake_address_line1,
      qi.address_line2 AS intake_address_line2,
      qi.county AS intake_county
    FROM quote_intakes qi
    ORDER BY created_at DESC`,
    )
    .all();

  return Response.json({ quotes });
}

export async function PATCH(request) {
  const client = await getSessionClient();
  if (!client || !client.is_admin) {
    return Response.json({ error: "Admin access required." }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const quoteId = Number.parseInt(body?.quoteId, 10);
  const itemType = String(body?.itemType || "").trim();
  const adminNote = String(body?.adminNote || "").trim().slice(0, 5000);

  if (!Number.isInteger(quoteId) || quoteId <= 0) {
    return Response.json({ error: "A valid quoteId is required." }, { status: 400 });
  }

  if (itemType !== "quote" && itemType !== "intake") {
    return Response.json({ error: "itemType must be quote or intake." }, { status: 400 });
  }

  const db = getDb();
  if (itemType === "quote") {
    const result = db.prepare("UPDATE quotes SET admin_note = ? WHERE id = ?").run(adminNote, quoteId);
    if (!result.changes) {
      return Response.json({ error: "Quote not found." }, { status: 404 });
    }
  } else {
    const result = db
      .prepare("UPDATE quote_intakes SET admin_note = ? WHERE id = ?")
      .run(adminNote, quoteId);
    if (!result.changes) {
      return Response.json({ error: "Quote not found." }, { status: 404 });
    }
  }

  return Response.json({ ok: true });
}
