import { getDb } from "@/lib/db";
import { getSessionClient } from "@/lib/auth";
import { sendQuoteRequestEmail, quoteRecipient, isEmailConfigured } from "@/lib/email";

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

const damageLabels = {
  scratch: "Scratch",
  dent: "Dent",
  bumper: "Bumper scuff",
  alloy: "Alloy wheel",
};

const severityLabels = {
  small: "Small",
  medium: "Medium",
  large: "Large",
};

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function POST(request) {
  const client = await getSessionClient();
  if (!client) {
    return Response.json({ error: "Please log in to request a quote." }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const registration = String(body?.registration || "").trim().slice(0, 20);
  const postcode = String(body?.postcode || "").trim().slice(0, 20);
  const damageType = String(body?.damageType || "");
  const severity = String(body?.severity || "");
  const otherDetails = String(body?.otherDetails || "").trim().slice(0, 2000);
  const contactMethods = Array.isArray(body?.contactMethods)
    ? body.contactMethods.map((method) => String(method)).slice(0, 5)
    : [];
  const photoIds = Array.isArray(body?.photoIds)
    ? body.photoIds.map((id) => Number.parseInt(id, 10)).filter(Number.isInteger)
    : [];

  if (!basePriceMap[damageType]) {
    return Response.json({ error: "Unknown damage type." }, { status: 400 });
  }
  if (!severityMultipliers[severity]) {
    return Response.json({ error: "Unknown severity." }, { status: 400 });
  }

  const estimateLow = Math.round(basePriceMap[damageType] * severityMultipliers[severity]);
  const estimateHigh = Math.round(estimateLow * 1.25);

  const db = getDb();
  db.prepare(
    `INSERT INTO quotes (
      client_id,
      damage_type,
      severity,
      panels,
      registration,
      postcode,
      contact_methods,
      other_details,
      estimate_low,
      estimate_high
    )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    client.id,
    damageType,
    severity,
    1,
    registration,
    postcode,
    contactMethods.join(", "),
    otherDetails,
    estimateLow,
    estimateHigh,
  );

  const attachments = [];
  if (photoIds.length) {
    const placeholders = photoIds.map(() => "?").join(", ");
    const photos = db
      .prepare(
        `SELECT id, filename, mime_type, photo_data FROM photos
         WHERE client_id = ? AND id IN (${placeholders})`,
      )
      .all(client.id, ...photoIds);

    for (const photo of photos) {
      if (photo.photo_data) {
        attachments.push({
          filename: photo.filename,
          content: Buffer.from(photo.photo_data),
          contentType: photo.mime_type,
        });
      }
    }
  }

  const lines = [
    `New quote request from ${client.name} (${client.email})`,
    "",
    `Vehicle registration: ${registration || "—"}`,
    `Postcode: ${postcode || "—"}`,
    `Damage type: ${damageLabels[damageType] || damageType}`,
    `Severity: ${severityLabels[severity] || severity}`,
    `Other details: ${otherDetails || "—"}`,
    `Estimated range: GBP ${estimateLow} - GBP ${estimateHigh}`,
    `Preferred contact: ${contactMethods.length ? contactMethods.join(", ") : "—"}`,
    `Photos attached: ${attachments.length}`,
  ];

  const text = lines.join("\n");
  const html = `<div style="font-family:Arial,sans-serif">${lines
    .map((line) => (line ? `<p style="margin:2px 0">${escapeHtml(line)}</p>` : "<br/>"))
    .join("")}</div>`;

  let emailResult;
  try {
    emailResult = await sendQuoteRequestEmail({
      subject: `New quote request from ${client.name}`,
      text,
      html,
      attachments,
    });
  } catch (error) {
    return Response.json(
      {
        saved: true,
        emailed: false,
        error: "Quote saved, but the email could not be sent. Please check the server email settings.",
      },
      { status: 200 },
    );
  }

  return Response.json(
    {
      saved: true,
      emailed: emailResult.sent,
      recipient: quoteRecipient,
      emailConfigured: isEmailConfigured(),
      note: emailResult.sent ? undefined : emailResult.reason,
    },
    { status: 201 },
  );
}
