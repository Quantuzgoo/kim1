const reviews = [
  {
    name: "Olivia R.",
    text: "Booked online at 8am, technician arrived same day, and the bumper looks factory fresh.",
  },
  {
    name: "Marcus T.",
    text: "Really clean finish on a deep scratch along the rear quarter panel. Great communication too.",
  },
  {
    name: "Priya N.",
    text: "Used Nova before returning a lease. The cosmetic package saved me more than expected.",
  },
];

export const metadata = {
  title: "Reviews | Nova Bodyworks",
};

export default function ReviewsPage() {
  return (
    <main className="bg-slate-950 px-4 py-14 sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-5xl">
        <h1 className="font-display text-5xl font-bold tracking-wide text-white sm:text-6xl">
          Reviews
        </h1>
        <p className="mt-4 text-slate-300">
          Drivers choose Nova Bodyworks for precise mobile repairs and dependable service.
        </p>

        <div className="mt-10 space-y-5">
          {reviews.map((review) => (
            <article key={review.name} className="rounded-2xl border border-white/10 bg-slate-900/80 p-6">
              <p className="text-lg text-slate-100">"{review.text}"</p>
              <p className="mt-4 text-sm font-semibold uppercase tracking-[0.15em] text-cyan-300">
                {review.name}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
