"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

function formatDate(value) {
  if (!value) {
    return "-";
  }
  const date = new Date(value.includes("T") ? value : `${value.replace(" ", "T")}Z`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default function AccountPage() {
  const [client, setClient] = useState(null);
  const [isChecked, setIsChecked] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [quotes, setQuotes] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const meResponse = await fetch("/api/auth/me");
        const meData = await meResponse.json();
        setClient(meData.client);

        if (meData.client) {
          const [photosResponse, quotesResponse] = await Promise.all([
            fetch("/api/photos"),
            fetch("/api/quotes"),
          ]);
          const photosData = await photosResponse.json();
          const quotesData = await quotesResponse.json();
          setPhotos(photosData.photos || []);
          setQuotes(quotesData.quotes || []);
        }
      } catch {
        setClient(null);
      } finally {
        setIsChecked(true);
      }
    };

    load();
  }, []);

  if (!isChecked) {
    return (
      <main className="grid min-h-[70vh] place-items-center bg-slate-950 px-4 py-16 text-center">
        <p className="text-slate-300">Loading your account...</p>
      </main>
    );
  }

  if (!client) {
    return (
      <main className="grid min-h-[70vh] place-items-center bg-slate-950 px-4 py-16 text-center">
        <div>
          <h1 className="font-display text-5xl font-bold tracking-wide text-white">My Account</h1>
          <p className="mt-3 text-slate-300">
            Please log in using the Login button in the header to view your photos and quotes.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-slate-950 px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <div>
          <Link
            href="/quote"
            className="relative -left-[30px] -top-[40px] inline-flex rounded-md bg-cyan-400 px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-slate-950 transition hover:bg-cyan-300"
          >
            Start New Quote
          </Link>
        </div>

        <div className="relative -top-[30px]">
          <div className="mt-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">My Account</p>
              <h1 className="font-display mt-2 text-5xl font-bold tracking-wide text-white">
                Welcome, {client.name}
              </h1>
              <p className="mt-2 text-slate-300">{client.email}</p>
            </div>
          </div>

          <section className="mt-10">
            <h2 className="font-display text-3xl font-bold text-white">
              My Quotes <span className="text-cyan-300">({quotes.length})</span>
            </h2>
            {quotes.length === 0 ? (
              <p className="mt-3 text-slate-400">
                No saved quotes yet. Use the Quote page to get an estimate and save it.
              </p>
            ) : (
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {quotes.map((quote) => (
                  <article
                    key={quote.id}
                    className="rounded-2xl border border-white/10 bg-slate-900/75 p-5"
                  >
                    <p className="text-xs uppercase tracking-[0.18em] text-emerald-300">
                      {quote.status}
                    </p>
                    <h3 className="mt-2 font-display text-2xl font-semibold capitalize text-white">
                      {quote.damage_type} - {quote.severity}
                    </h3>
                    <p className="mt-1 text-sm text-slate-300">
                      {quote.panels} panel{quote.panels === 1 ? "" : "s"}
                    </p>
                    <p className="mt-3 text-lg font-extrabold text-cyan-300">
                      GBP {quote.estimate_low} - {quote.estimate_high}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">{formatDate(quote.created_at)}</p>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="mt-12">
            <h2 className="font-display text-3xl font-bold text-white">
              My Photos <span className="text-cyan-300">({photos.length})</span>
            </h2>
            {photos.length === 0 ? (
              <p className="mt-3 text-slate-400">
                No photos yet. Use Send Photos on the home page to upload pictures of the damage.
              </p>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                {photos.map((photo) => (
                  <figure
                    key={photo.id}
                    className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/75"
                  >
                    <img
                      src={photo.url}
                      alt={photo.description || `Photo ${photo.id}`}
                      className="h-44 w-full object-cover"
                    />
                    <figcaption className="p-3">
                      <p className="text-sm text-slate-200">
                        {photo.description || "No description"}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">{formatDate(photo.created_at)}</p>
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
