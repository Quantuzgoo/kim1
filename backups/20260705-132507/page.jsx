"use client";

import { useState } from "react";
import Link from "next/link";
import { services } from "./_data/services";

export default function Home() {
  const [isSendPhotosOpen, setIsSendPhotosOpen] = useState(false);
  const [activePhotoSlide, setActivePhotoSlide] = useState(0);
  const totalSlots = 8;
  const slotGroups = [
    [1, 2, 3, 4],
    [5, 6, 7, 8],
  ];
  const [slotImages, setSlotImages] = useState(Array(totalSlots).fill(null));
  const [slotDescriptions, setSlotDescriptions] = useState(Array(totalSlots).fill(""));
  const handleDescriptionChange = (slotIndex, event) => {
    const value = event.target.value;
    setSlotDescriptions((current) => {
      const next = [...current];
      next[slotIndex] = value;
      return next;
    });
  };

  const handleRemoveImage = (slotIndex) => {
    setSlotImages((current) => {
      const next = [...current];
      if (next[slotIndex]) {
        URL.revokeObjectURL(next[slotIndex]);
      }
      next[slotIndex] = null;
      return next;
    });
  };

  const handleReplaceImage = (slotIndex) => {
    const input = document.getElementById(`slot-upload-${slotIndex}`);
    if (input) {
      input.click();
    }
  };

  const handleOpenCamera = () => {
    const firstSlotNumber = slotGroups[activePhotoSlide]?.[0];
    if (!firstSlotNumber) {
      return;
    }

    const slotIndex = firstSlotNumber - 1;
    const input = document.getElementById(`slot-upload-${slotIndex}`);
    if (input) {
      input.click();
    }
  };


  const handleImageUpload = (slotIndex, event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      return;
    }

    setSlotImages((current) => {
      const next = [...current];
      if (next[slotIndex]) {
        URL.revokeObjectURL(next[slotIndex]);
      }
      next[slotIndex] = URL.createObjectURL(file);
      return next;
    });
  };

  return (
    <main className="bg-slate-950">
      <section className="relative overflow-hidden border-b border-white/10 px-4 py-18 sm:px-6 lg:px-8">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "linear-gradient(115deg, rgba(2, 6, 23, 0.92), rgba(2, 6, 23, 0.58)), radial-gradient(circle at 85% 20%, rgba(34, 211, 238, 0.22), transparent 42%), url('/CarBodyworkManSprayingSilverCar.jpg')",
          }}
        />

        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">
              Mobile SMART Repair Specialists
            </p>
            <h1 className="font-display mt-4 text-5xl font-bold tracking-wide text-white sm:text-6xl lg:text-7xl">
              Car bodywork fixes, at your door.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
              Scratches, dents, bumper scuffs, and alloy damage repaired by trained technicians at home or work.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/quote"
                className="rounded-md bg-cyan-400 px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] text-slate-950 transition hover:bg-cyan-300"
              >
                Start My Quote
              </Link>
              <Link
                href="/services"
                className="rounded-md border border-white/25 bg-white/5 px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white transition hover:bg-white/10"
              >
                View Services
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/15 bg-slate-900/70 p-6 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
              Why Drivers Choose Us
            </p>
            <ul className="mt-4 space-y-3 text-slate-100">
              <li>Same-week appointments in most areas</li>
              <li>Premium paint blending for invisible repairs</li>
              <li>Clear pricing before work begins</li>
              <li>Designed for busy schedules</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Most Requested</p>
              <h2 className="font-display mt-2 text-4xl font-bold tracking-wide text-white sm:text-5xl">
                Popular Repair Services
              </h2>
            </div>
            <Link href="/services" className="text-sm font-semibold text-cyan-300 hover:text-cyan-200">
              See all services
            </Link>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {services.slice(0, 6).map((service) => {
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
                <article key={service.slug} className="rounded-2xl border border-white/10 bg-slate-900/75 p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-emerald-300">{service.duration}</p>
                  <h3 className="mt-3 font-display text-3xl font-semibold text-white">{service.name}</h3>
                  <p className="mt-3 text-slate-300">{service.summary}</p>
                  <div className="mt-5 flex items-center justify-between">
                    <p className="text-sm font-semibold text-cyan-300">{service.priceBand}</p>
                    <Link href={detailsHref} className="text-sm font-semibold text-white hover:text-cyan-300">
                      Details
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-3">
          <article className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Step 1</p>
            <h3 className="mt-3 text-xl font-bold text-white">
              <button
                type="button"
                onClick={() => {
                  setActivePhotoSlide(0);
                  setIsSendPhotosOpen(true);
                }}
                className="cursor-pointer underline underline-offset-2 hover:text-cyan-300"
              >
                Send photos
              </button>
            </h3>
            <p className="mt-2 text-slate-300">Upload clear shots of the damage and your postcode.</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Step 2</p>
            <h3 className="mt-3 text-xl font-bold text-white">Get a clear price</h3>
            <p className="mt-2 text-slate-300">Receive a transparent quote and available booking windows.</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Step 3</p>
            <h3 className="mt-3 text-xl font-bold text-white">Repair completed</h3>
            <p className="mt-2 text-slate-300">Your technician completes the work at your location.</p>
          </article>
        </div>
      </section>

      {isSendPhotosOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 px-[5%] py-[5%]"
          role="dialog"
          aria-modal="true"
          aria-label="Send Photos"
        >
          <div className="flex w-full max-w-7xl max-h-[90vh] flex-col overflow-hidden rounded-2xl border border-white/15 bg-slate-900 p-[clamp(0.75rem,1.8vmin,2rem)] shadow-2xl shadow-cyan-950/40">
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h2 className="font-display text-[clamp(1.4rem,3.2vmin,2.25rem)] font-bold tracking-wide text-white">
                  Send Photos
                </h2>
                <div className="flex items-center gap-3">
                  <p className="pt-1 text-right text-[clamp(0.7rem,1.3vmin,0.9rem)] text-slate-300">
                    {activePhotoSlide + 1} of {slotGroups.length}
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsSendPhotosOpen(false)}
                    aria-label="Close Send Photos dialog"
                    title="Close"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/90 bg-[#ff0000]/35 text-white transition hover:bg-[#ff0000]/35 hover:opacity-50"
                  >
                    <svg
                      viewBox="0 0 20 20"
                      fill="none"
                      aria-hidden="true"
                      className="h-4 w-4"
                    >
                      <path d="M5 5L15 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                      <path d="M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="send-photos-scroll-area relative mt-5 min-h-0 flex-1 max-h-[calc(75%_-_75px)] overflow-x-hidden overflow-y-scroll rounded-xl border border-white/10 bg-slate-950/70">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 right-0 z-20 w-4 border-l border-cyan-300/45 bg-slate-900/45"
                />
                <div
                  className="flex h-full transition-transform duration-300 ease-out"
                  style={{ transform: `translateX(-${activePhotoSlide * 100}%)` }}
                >
                  {slotGroups.map((slotPair, groupIndex) => (
                    <div
                      key={groupIndex}
                      className="grid min-h-full min-w-full content-start gap-[clamp(0.5rem,1.3vmin,1rem)] px-[clamp(0.5rem,1.6vmin,1.5rem)] pb-[calc(clamp(0.5rem,1.6vmin,1.5rem)+15px)] pt-[calc(clamp(0.5rem,1.6vmin,1.5rem)+15px)] sm:grid-cols-2 xl:grid-cols-4"
                    >
                      {slotPair.map((slotNumber) => {
                        const slotIndex = slotNumber - 1;

                        return (
                          <div key={slotNumber} className="mx-auto w-full max-w-[clamp(11rem,25vmin,20rem)]">
                            <p className="mb-1 text-center text-[clamp(0.6rem,1.2vmin,0.75rem)] font-semibold uppercase tracking-[0.14em] text-cyan-300">
                              Description
                            </p>
                            <input
                              type="text"
                              value={slotDescriptions[slotIndex]}
                              onChange={(event) => handleDescriptionChange(slotIndex, event)}
                              placeholder={`Describe slot ${slotNumber}`}
                              className="mb-[clamp(0.45rem,1vmin,0.75rem)] w-full rounded-md border border-white/20 bg-slate-950 px-[clamp(0.5rem,1.1vmin,0.75rem)] py-[clamp(0.35rem,0.9vmin,0.55rem)] text-center text-[clamp(0.72rem,1.45vmin,0.9rem)] text-white placeholder:text-center placeholder:text-slate-400"
                            />

                            <label className="flex h-[clamp(8.5rem,24vmin,15rem)] w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-cyan-300/50 bg-cyan-500/5 px-[clamp(0.5rem,1.5vmin,1rem)] py-[clamp(0.6rem,1.8vmin,1.5rem)] hover:bg-cyan-500/10">
                              <input
                                id={`slot-upload-${slotIndex}`}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                                onChange={(event) => handleImageUpload(slotIndex, event)}
                              />

                              {slotImages[slotIndex] ? (
                                <>
                                  <img
                                    src={slotImages[slotIndex]}
                                    alt={`Uploaded slot ${slotNumber}`}
                                    className="h-full max-h-[clamp(5.5rem,16vmin,10rem)] w-auto rounded-lg object-cover"
                                  />
                                  <p className="mt-[clamp(0.35rem,0.9vmin,0.75rem)] text-[clamp(0.68rem,1.4vmin,0.9rem)] font-semibold text-cyan-200">
                                    Replace image in slot {slotNumber}
                                  </p>
                                </>
                              ) : (
                                <>
                                  <p className="text-[clamp(0.68rem,1.4vmin,0.9rem)] uppercase tracking-[0.18em] text-cyan-300">
                                    Image Slot {slotNumber}
                                  </p>
                                  <p className="mt-[clamp(0.25rem,0.8vmin,0.5rem)] text-[clamp(0.64rem,1.3vmin,0.85rem)] text-slate-300">
                                    Click to upload image
                                  </p>
                                </>
                              )}
                            </label>

                            <div className="mt-[clamp(0.45rem,1vmin,0.75rem)] grid w-full grid-cols-2 gap-[clamp(0.3rem,0.8vmin,0.5rem)]">
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(slotIndex)}
                                disabled={!slotImages[slotIndex]}
                                className="w-full rounded-md bg-cyan-400 px-[clamp(0.4rem,1vmin,0.75rem)] py-[clamp(0.35rem,0.9vmin,0.55rem)] text-[clamp(0.56rem,1.1vmin,0.75rem)] font-bold uppercase tracking-[0.12em] text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                Remove image
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReplaceImage(slotIndex)}
                                disabled={!slotImages[slotIndex]}
                                className="w-full rounded-md bg-cyan-400 px-[clamp(0.4rem,1vmin,0.75rem)] py-[clamp(0.35rem,0.9vmin,0.55rem)] text-[clamp(0.56rem,1.1vmin,0.75rem)] font-bold uppercase tracking-[0.12em] text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                Replace image
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setActivePhotoSlide((current) => Math.max(0, current - 1))}
                  disabled={activePhotoSlide === 0}
                  className="rounded-md bg-cyan-400 px-[clamp(0.6rem,1.5vmin,1rem)] py-[clamp(0.35rem,1vmin,0.6rem)] text-[clamp(0.7rem,1.4vmin,0.9rem)] font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={handleOpenCamera}
                  className="rounded-md bg-cyan-400 px-[clamp(0.9rem,2vmin,1.25rem)] py-[clamp(0.4rem,1vmin,0.6rem)] text-[clamp(0.7rem,1.4vmin,0.9rem)] font-bold uppercase tracking-[0.12em] text-slate-950 transition hover:bg-cyan-300"
                >
                  Camera
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setActivePhotoSlide((current) =>
                      Math.min(slotGroups.length - 1, current + 1),
                    )
                  }
                  disabled={activePhotoSlide === slotGroups.length - 1}
                  className="rounded-md bg-cyan-400 px-[clamp(0.6rem,1.5vmin,1rem)] py-[clamp(0.35rem,1vmin,0.6rem)] text-[clamp(0.7rem,1.4vmin,0.9rem)] font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
