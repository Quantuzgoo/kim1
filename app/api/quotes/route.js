import { getDb } from "@/lib/db";
import { getSessionClient } from "@/lib/auth";

const basePriceMap = {
  scratch: 110,
  dent: 160,
  bumper: 140,
  alloy: 95,
};

const severityMultipliers = {
  small: 1,
  medium: 1.35,
  large: 1.8,
};

export async function GET() {
  const client = await getSessionClient();
  if (!client) {
    return Response.json({ error: "Please log in first." }, { status: 401 });
  }

  const quotes = getDb()
    .prepare(
      `SELECT id, damage_type, severity, panels, estimate_low, estimate_high, status, created_at
       FROM quotes WHERE client_id = ? ORDER BY created_at DESC`,
    )
    .all(client.id);

  return Response.json({ quotes });
}

export async function POST(request) {
  const client = await getSessionClient();
  if (!client) {
    return Response.json({ error: "Please log in to save a quote." }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const damageType = String(body?.damageType || "");
  const severity = String(body?.severity || "");
  const panels = Number.parseInt(body?.panels, 10);

  if (!basePriceMap[damageType]) {
    return Response.json({ error: "Unknown damage type." }, { status: 400 });
  }
  if (!severityMultipliers[severity]) {
    return Response.json({ error: "Unknown severity." }, { status: 400 });
  }
  if (!Number.isInteger(panels) || panels < 1 || panels > 6) {
    return Response.json({ error: "Panels must be between 1 and 6." }, { status: 400 });
  }

  const estimateLow = Math.round(basePriceMap[damageType] * severityMultipliers[severity] * panels);
  const estimateHigh = Math.round(estimateLow * 1.25);

  const result = getDb()
    .prepare(
      `INSERT INTO quotes (client_id, damage_type, severity, panels, estimate_low, estimate_high)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(client.id, damageType, severity, panels, estimateLow, estimateHigh);

  return Response.json(
    {
      quote: {
        id: Number(result.lastInsertRowid),
        damage_type: damageType,
        severity,
        panels,
        estimate_low: estimateLow,
        estimate_high: estimateHigh,
        status: "new",
      },
    },
    { status: 201 },
  );
}
