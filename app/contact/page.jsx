export const metadata = {
  title: "Contact | Nova Bodyworks",
};

export default function ContactPage() {
  return (
    <main className="bg-slate-950 px-4 py-14 sm:px-6 lg:px-8">
      <section className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-2">
        <div>
          <h1 className="font-display text-5xl font-bold tracking-wide text-white sm:text-6xl">
            Contact
          </h1>
          <p className="mt-4 max-w-xl text-slate-300">
            Tell us where the damage is, share a few photos, and we will send a clear quote.
          </p>
          <div className="mt-8 space-y-3 text-slate-200">
            <p>Phone: 0800 000 000</p>
            <p>Email: hello@novabodyworks.co.uk</p>
            <p>Hours: Mon-Sat, 8:00-18:00</p>
          </div>
        </div>

        <form className="rounded-2xl border border-white/10 bg-slate-900/80 p-6">
          <div className="grid gap-4">
            <input className="rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-white" placeholder="Full name" />
            <input className="rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-white" placeholder="Email" type="email" />
            <input className="rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-white" placeholder="Postcode" />
            <textarea className="min-h-32 rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-white" placeholder="Describe the damage" />
            <button type="button" className="rounded-md bg-cyan-400 px-4 py-2 font-bold text-slate-950 transition hover:bg-cyan-300">
              Send Request
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
