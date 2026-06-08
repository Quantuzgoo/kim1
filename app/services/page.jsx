import Link from "next/link";
import { services } from "../_data/services";

export const metadata = {
  title: "Services | Nova Bodyworks",
};

export default function ServicesPage() {
  return (
    <main className="bg-slate-950 px-4 py-14 sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-7xl">
        <h1 className="font-display text-5xl font-bold tracking-wide text-white sm:text-6xl">
          Services
        </h1>
        <p className="mt-4 max-w-2xl text-slate-300">
          Cosmetic repair services built for convenience, speed, and premium finish quality.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => {
            const detailsHref =
              service.slug === "bumper-scuff-repair"
                ? "/services/bumper-scuff-repair-coming-soon"
                : service.slug === "scratch-paint-repair"
                  ? "/services/scratch-paint-repair-coming-soon"
                  : service.slug === "minor-dent-repair"
                    ? "/services/minor-dent-repair-coming-soon"
                    : service.slug === "alloy-wheel-repair"
                      ? "/services/alloy-wheel-repair-coming-soon"
                      : service.slug === "end-of-lease-refresh"
                        ? "/services/end-of-lease-refresh-coming-soon"
                        : service.slug === "paint-transfer-removal"
                          ? "/services/paint-transfer-removal-coming-soon"
                : `/services/${service.slug}`;

            return (
              <article
                key={service.slug}
                className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-lg shadow-cyan-950/20"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                  {service.duration}
                </p>
                <h2 className="mt-3 font-display text-3xl font-semibold text-white">
                  {service.name}
                </h2>
                <p className="mt-3 text-slate-300">{service.summary}</p>
                <p className="mt-5 text-sm font-semibold text-emerald-300">
                  {service.priceBand}
                </p>
                <Link
                  href={detailsHref}
                  className="mt-6 inline-block rounded-md bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
                >
                  View Details
                </Link>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
