import { getDb } from "@/lib/db";

function sanitizeReferenceValue(value, maxLength) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .slice(0, maxLength);
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = String(body?.email || "")
    .trim()
    .toLowerCase()
    .slice(0, 160);
  const registration = sanitizeReferenceValue(body?.registration, 20);
  const postcode = sanitizeReferenceValue(body?.postcode, 20);

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "A valid email is required." }, { status: 400 });
  }

  if (!registration || !postcode) {
    return Response.json(
      { error: "Registration and postcode are required." },
      { status: 400 },
    );
  }

  const reference = `Q-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const result = getDb()
    .prepare(
      "INSERT INTO quote_intakes (email, registration, postcode, reference, status) VALUES (?, ?, ?, ?, 'new')",
    )
    .run(email, registration, postcode, reference);

  return Response.json(
    {
      saved: true,
      id: Number(result.lastInsertRowid),
      reference,
      email,
      registration,
      postcode,
    },
    { status: 201 },
  );
}
