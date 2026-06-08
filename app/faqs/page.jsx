const faqs = [
  {
    q: "Do you come to my home or workplace?",
    a: "Yes. Most repairs are completed at your address, as long as there is safe working space.",
  },
  {
    q: "How quickly can I get a quote?",
    a: "Most photo-based quotes are returned within one working day.",
  },
  {
    q: "Will the repair be visible afterwards?",
    a: "Our process is designed for seamless blending, especially for minor to medium cosmetic damage.",
  },
  {
    q: "Do you repair structural accident damage?",
    a: "No. We focus on cosmetic SMART repairs, not major structural collision work.",
  },
];

export const metadata = {
  title: "FAQs | Nova Bodyworks",
};

export default function FAQsPage() {
  return (
    <main className="bg-slate-950 px-4 py-14 sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-5xl">
        <h1 className="font-display text-5xl font-bold tracking-wide text-white sm:text-6xl">
          FAQs
        </h1>
        <div className="mt-10 space-y-4">
          {faqs.map((item) => (
            <article key={item.q} className="rounded-2xl border border-white/10 bg-slate-900/80 p-6">
              <h2 className="text-xl font-semibold text-white">{item.q}</h2>
              <p className="mt-3 text-slate-300">{item.a}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
