import QuoteCalculator from "./quote-calculator";
import BackButton from "./back-button";
import QuoteSteps from "./quote-steps";

export const metadata = {
  title: "Quote | Nova Bodyworks",
};

export default function QuotePage() {
  return (
    <main className="bg-slate-950 px-4 pb-14 pt-[21px] sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <BackButton />
      </div>
      <section className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1.05fr_1fr]">
        <div>
          <h1 className="font-display text-5xl font-bold tracking-wide text-white sm:text-6xl">
            Get a Quote
          </h1>
          <p className="mt-5 max-w-xl text-slate-300">
            Use the calculator for a fast estimate, then send your photos for a fixed quote from our team.
          </p>

          <QuoteSteps />
        </div>

        <QuoteCalculator />
      </section>
    </main>
  );
}
