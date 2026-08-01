import { cookies } from "next/headers";
import { getSessionClient, SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from "@/lib/auth";

export async function GET() {
  const client = await getSessionClient();

  if (!client) {
    return Response.json({ client: null });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    cookieStore.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS);
  }

  return Response.json({
    client: { name: client.name, email: client.email, isAdmin: Boolean(client.is_admin) },
  });
}
