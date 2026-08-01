import crypto from "node:crypto";
import { getDb } from "@/lib/db";
import { getSessionClient } from "@/lib/auth";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/heic": "heic",
  "image/heif": "heif",
};

export async function GET() {
  const client = await getSessionClient();
  if (!client) {
    return Response.json({ error: "Please log in first." }, { status: 401 });
  }

  const photos = getDb()
    .prepare(
      "SELECT id, description, mime_type, created_at FROM photos WHERE client_id = ? ORDER BY created_at DESC",
    )
    .all(client.id)
    .map((photo) => ({ ...photo, url: `/api/photos/${photo.id}` }));

  return Response.json({ photos });
}

export async function POST(request) {
  const client = await getSessionClient();
  if (!client) {
    return Response.json({ error: "Please log in to send photos." }, { status: 401 });
  }

  const formData = await request.formData();
  const files = formData.getAll("photos");
  const descriptions = formData.getAll("descriptions");

  if (!files.length) {
    return Response.json({ error: "No photos supplied." }, { status: 400 });
  }

  const db = getDb();
  const saved = [];

  for (const [index, file] of files.entries()) {
    if (typeof file === "string") {
      continue;
    }

    const extension = EXTENSIONS[file.type];
    if (!extension) {
      return Response.json({ error: "Only image uploads are allowed." }, { status: 400 });
    }
    if (file.size > MAX_FILE_BYTES) {
      return Response.json({ error: "Each photo must be 10MB or smaller." }, { status: 400 });
    }

    const filename = `${crypto.randomUUID()}.${extension}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const description = String(descriptions[index] ?? "").slice(0, 300);
    const result = db
      .prepare(
        "INSERT INTO photos (client_id, filename, mime_type, photo_data, description) VALUES (?, ?, ?, ?, ?)",
      )
      .run(client.id, filename, file.type, buffer, description);

    saved.push({ id: Number(result.lastInsertRowid), description });
  }

  return Response.json({ saved: saved.length, photos: saved }, { status: 201 });
}
