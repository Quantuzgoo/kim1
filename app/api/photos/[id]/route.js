import { getDb } from "@/lib/db";
import { getSessionClient } from "@/lib/auth";

export async function GET(request, { params }) {
  const client = await getSessionClient();
  if (!client) {
    return Response.json({ error: "Please log in first." }, { status: 401 });
  }

  const { id } = await params;
  const photoId = Number.parseInt(id, 10);
  if (!Number.isInteger(photoId)) {
    return Response.json({ error: "Photo not found." }, { status: 404 });
  }

  const photo = getDb()
    .prepare("SELECT client_id, mime_type, photo_data FROM photos WHERE id = ?")
    .get(photoId);

  if (!photo || (photo.client_id !== client.id && !client.is_admin)) {
    return Response.json({ error: "Photo not found." }, { status: 404 });
  }

  if (!photo.photo_data) {
    return Response.json({ error: "Photo data is missing." }, { status: 404 });
  }

  return new Response(photo.photo_data, {
    headers: {
      "Content-Type": photo.mime_type,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
