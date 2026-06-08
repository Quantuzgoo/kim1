import QuoteCalculator from "./quote-calculator";

export const metadata = {
  title: "Quote | Nova Bodyworks",
};

export default function QuotePage() {
  return (
    <main className="bg-slate-950 px-4 py-14 sm:px-6 lg:px-8">
      <section className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1.05fr_1fr]">
        <div>
          <h1 className="font-display text-5xl font-bold tracking-wide text-white sm:text-6xl">
            Get a Quote
          </h1>
          <p className="mt-5 max-w-xl text-slate-300">
            Use the calculator for a fast estimate, then send your photos for a fixed quote from our team.
          </p>

          <ol className="mt-8 space-y-4 text-slate-200">
            <li>1. Upload clear photos from multiple angles.</li>
            <li>2. Share postcode and vehicle registration.</li>
            <li>3. Receive your confirmed price and booking slots.</li>
          </ol>
        </div>

        <QuoteCalculator />
      </section>
    </main>
  );
}
