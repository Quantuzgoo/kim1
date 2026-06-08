import { notFound } from "next/navigation";
import { services } from "../../_data/services";

export function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }));
}

export function generateMetadata({ params }) {
  const service = services.find((item) => item.slug === params.slug);
  if (!service) {
    return { title: "Service Not Found | Nova Bodyworks" };
  }

  return {
    title: `${service.name} | Nova Bodyworks`,
    description: service.summary,
  };
}

export default function ServiceDetailPage({ params }) {
  const service = services.find((item) => item.slug === params.slug);

  if (!service) {
    notFound();
  }

  return (
    <main className="bg-slate-950 px-4 py-14 sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-5xl rounded-3xl border border-white/10 bg-slate-900/80 p-8 sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
          {service.duration}
        </p>
        <h1 className="mt-3 font-display text-5xl font-bold tracking-wide text-white sm:text-6xl">
          {service.name}
        </h1>
        <p className="mt-5 max-w-3xl text-lg text-slate-300">{service.summary}</p>

        <p className="mt-7 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">
          {service.priceBand}
        </p>

        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {service.highlights.map((highlight) => (
            <li key={highlight} className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-slate-200">
              {highlight}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
