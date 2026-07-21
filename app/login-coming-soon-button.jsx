import Link from "next/link";

export default function LoginComingSoonButton() {
  return (
    <Link
      href="/view-account-details-coming-soon"
      className="rounded-md bg-cyan-400 px-4 py-2 text-xs font-extrabold tracking-wide text-slate-950 transition hover:bg-cyan-300 sm:text-sm"
    >
        Login
    </Link>
  );
}