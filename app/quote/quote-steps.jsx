"use client";

import { useState } from "react";
import SendPhotosDialog from "@/app/send-photos-dialog";

const contactOptions = ["Email", "Text", "Post"];

const damageTypeOptions = [
  { value: "scratch", label: "Scratch" },
  { value: "dent", label: "Dent" },
  { value: "bumper", label: "Bumper scuff" },
  { value: "alloy", label: "Alloy wheel" },
];

const severityOptions = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

const totalSteps = 5;

function labelFor(options, value) {
  return options.find((option) => option.value === value)?.label || "";
}

export default function QuoteSteps() {
  const [step, setStep] = useState(1);
  const [editingFromSummary, setEditingFromSummary] = useState(false);

  const [email, setEmail] = useState("");
  const [registration, setRegistration] = useState("");
  const [postcode, setPostcode] = useState("");
  const [damageType, setDamageType] = useState("scratch");
  const [severity, setSeverity] = useState("small");
  const [otherDetails, setOtherDetails] = useState("");
  const [isSendPhotosOpen, setIsSendPhotosOpen] = useState(false);
  const [uploadedPhotoIds, setUploadedPhotoIds] = useState([]);
  const [photoMessage, setPhotoMessage] = useState("");
  const [quoteIntakeMessage, setQuoteIntakeMessage] = useState("");
  const [contactMethods, setContactMethods] = useState(["Email"]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  const handleRegistrationChange = (value) => {
    setRegistration(value.toUpperCase());
  };

  const goToStep = (target) => {
    setSubmitMessage("");
    setStep(target);
  };

  const handleNext = () => {
    if (editingFromSummary) {
      setEditingFromSummary(false);
      goToStep(5);
      return;
    }

    goToStep(Math.min(totalSteps, step + 1));
  };

  const handleBack = () => {
    goToStep(Math.max(1, step - 1));
  };

  const handleEdit = (target) => {
    setEditingFromSummary(true);
    goToStep(target);
  };

  const refreshUploadedPhotos = async () => {
    try {
      const response = await fetch("/api/photos");
      const data = await response.json();

      if (response.status === 401) {
        setPhotoMessage("Photos can be added now and your quote reference will be saved when you press Done.");
        setUploadedPhotoIds([]);
        return;
      }
      if (!response.ok || !Array.isArray(data.photos)) {
        setPhotoMessage("Could not load your uploaded photos yet.");
        return;
      }

      setUploadedPhotoIds(data.photos.map((photo) => photo.id));
      setPhotoMessage(
        data.photos.length
          ? `${data.photos.length} photo${data.photos.length === 1 ? "" : "s"} currently available for your quote.`
          : "No photos uploaded yet.",
      );
    } catch {
      setPhotoMessage("Could not load your uploaded photos yet.");
    }
  };

  const handleOpenSendPhotos = async () => {
    setQuoteIntakeMessage("");
    setPhotoMessage("");
    await refreshUploadedPhotos();
    setIsSendPhotosOpen(true);
  };

  const handleCloseSendPhotos = async () => {
    setIsSendPhotosOpen(false);
    await refreshUploadedPhotos();
  };

  const handleQuoteDone = (data) => {
    if (data?.reference) {
      setQuoteIntakeMessage(`Saved for admin review. Reference: ${data.reference}`);
      return;
    }
    setQuoteIntakeMessage("Saved for admin review.");
  };

  const toggleContactMethod = (method) => {
    setContactMethods((current) =>
      current.includes(method)
        ? current.filter((item) => item !== method)
        : [...current, method],
    );
  };

  const handleRequestQuote = async () => {
    setIsSubmitting(true);
    setSubmitMessage("");

    try {
      const response = await fetch("/api/quote-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registration,
          postcode,
          damageType,
          severity,
          otherDetails,
          contactMethods,
          photoIds: uploadedPhotoIds,
        }),
      });
      const data = await response.json();

      if (response.status === 401) {
        setSubmitMessage("Please log in (top right) to request your quote.");
        return;
      }
      if (!response.ok) {
        setSubmitMessage(data.error || "Could not request quote. Please try again.");
        return;
      }

      if (data.emailed) {
        setSubmitMessage("Quote requested! Your details have been sent to our team.");
      } else {
        setSubmitMessage("Quote requested and saved to My Account. (Email delivery is not set up on the server yet.)");
      }
    } catch {
      setSubmitMessage("Could not reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const primaryLabel = editingFromSummary ? "Finish Editing" : step === 4 ? "Review Summary" : "Next";

  return (
    <div className="mt-8 rounded-2xl border border-white/10 bg-slate-900/70 p-6">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
          Step {step} of {totalSteps}
        </p>
        <div className="flex gap-1.5">
          {Array.from({ length: totalSteps }, (_, index) => index + 1).map((dot) => (
            <span
              key={dot}
              className={`h-1.5 w-6 rounded-full ${dot <= step ? "bg-cyan-400" : "bg-white/15"}`}
            />
          ))}
        </div>
      </div>

      <div className="mt-5">
        {step === 1 && (
          <div>
            <h3 className="font-display text-2xl font-bold text-white">Details</h3>
            <label className="mt-4 block text-sm text-slate-200">
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="your@email.com"
                className="mt-1 block w-full rounded-md border border-white/15 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500"
              />
            </label>
            <label className="mt-4 block text-sm text-slate-200">
              Vehicle registration
              <input
                type="text"
                value={registration}
                onChange={(event) => handleRegistrationChange(event.target.value)}
                placeholder="Your vehicle registration"
                className="mt-1 block w-full rounded-md border border-white/15 bg-slate-950 px-3 py-2 text-sm uppercase text-white placeholder:normal-case placeholder:text-slate-500"
              />
            </label>

            <label className="mt-4 block text-sm text-slate-200">
              Postcode
              <input
                type="text"
                value={postcode}
                onChange={(event) => setPostcode(event.target.value)}
                placeholder="Your postcode"
                className="mt-1 block w-full rounded-md border border-white/15 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500"
              />
            </label>
          </div>
        )}

        {step === 2 && (
          <div>
            <h3 className="font-display text-2xl font-bold text-white">Work Required</h3>
            <label className="mt-4 block text-sm text-slate-200">
              Damage type
              <select
                value={damageType}
                onChange={(event) => setDamageType(event.target.value)}
                className="mt-1 block w-full rounded-md border border-white/15 bg-slate-950 px-3 py-2 text-sm text-white"
              >
                {damageTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-4 block text-sm text-slate-200">
              Severity
              <select
                value={severity}
                onChange={(event) => setSeverity(event.target.value)}
                className="mt-1 block w-full rounded-md border border-white/15 bg-slate-950 px-3 py-2 text-sm text-white"
              >
                {severityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-4 block text-sm text-slate-200">
              Other details
              <textarea
                value={otherDetails}
                onChange={(event) => setOtherDetails(event.target.value)}
                rows={4}
                placeholder="Tell us anything else about the damage or work required"
                className="mt-1 block w-full rounded-md border border-white/15 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500"
              />
            </label>
          </div>
        )}

        {step === 3 && (
          <div>
            <h3 className="font-display text-2xl font-bold text-white">Photos</h3>
            <p className="mt-2 text-sm text-slate-300">
              Open the Send Photos popup to upload images or take photos with your camera.
            </p>
            <button
              type="button"
              onClick={handleOpenSendPhotos}
              className="mt-4 rounded-md bg-cyan-400 px-4 py-2 text-sm font-extrabold uppercase tracking-wide text-slate-950 transition hover:bg-cyan-300"
            >
              Open Send Photos
            </button>
            <p className="mt-3 text-sm text-cyan-200">
              {photoMessage ||
                `${uploadedPhotoIds.length} photo${uploadedPhotoIds.length === 1 ? "" : "s"} currently available for your quote.`}
            </p>
            {quoteIntakeMessage && <p className="mt-2 text-sm text-emerald-300">{quoteIntakeMessage}</p>}
          </div>
        )}

        {step === 4 && (
          <div>
            <h3 className="font-display text-2xl font-bold text-white">Receive Your Quote</h3>
            <p className="mt-2 text-sm text-slate-300">How would you like to receive your quote?</p>
            <div className="mt-4 space-y-3">
              {contactOptions.map((method) => (
                <label
                  key={method}
                  className="flex items-center gap-3 rounded-lg border border-white/10 bg-slate-950 px-3 py-3 text-sm text-slate-200"
                >
                  <input
                    type="checkbox"
                    checked={contactMethods.includes(method)}
                    onChange={() => toggleContactMethod(method)}
                    className="h-4 w-4 accent-cyan-400"
                  />
                  {method}
                </label>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            <h3 className="font-display text-2xl font-bold text-white">Summary</h3>
            <div className="mt-4 space-y-3">
              <SummaryRow title="Details" onEdit={() => handleEdit(1)}>
                <p>Email: {email || "—"}</p>
                <p>Registration: {registration || "—"}</p>
                <p>Postcode: {postcode || "—"}</p>
              </SummaryRow>

              <SummaryRow title="Work Required" onEdit={() => handleEdit(2)}>
                <p>Damage type: {labelFor(damageTypeOptions, damageType)}</p>
                <p>Severity: {labelFor(severityOptions, severity)}</p>
                <p>Other details: {otherDetails.trim() || "—"}</p>
              </SummaryRow>

              <SummaryRow title="Photos" onEdit={() => handleEdit(3)}>
                <p>
                  {uploadedPhotoIds.length
                    ? `${uploadedPhotoIds.length} photo${uploadedPhotoIds.length === 1 ? "" : "s"} added`
                    : "No photos added"}
                </p>
              </SummaryRow>

              <SummaryRow title="Receive Your Quote" onEdit={() => handleEdit(4)}>
                <p>{contactMethods.length ? contactMethods.join(", ") : "—"}</p>
              </SummaryRow>
            </div>

            <button
              type="button"
              onClick={handleRequestQuote}
              disabled={isSubmitting}
              className="mt-6 w-full rounded-md bg-cyan-400 px-4 py-2 text-sm font-extrabold uppercase tracking-wide text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Requesting..." : "Request Quote"}
            </button>
            {submitMessage && <p className="mt-3 text-sm text-cyan-200">{submitMessage}</p>}
          </div>
        )}
      </div>

      {step < 5 && (
        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 1 || editingFromSummary}
            className="rounded-md border border-white/25 px-4 py-2 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="rounded-md bg-cyan-400 px-4 py-2 text-sm font-extrabold uppercase tracking-wide text-slate-950 transition hover:bg-cyan-300"
          >
            {primaryLabel}
          </button>
        </div>
      )}

      <SendPhotosDialog
        open={isSendPhotosOpen}
        onClose={handleCloseSendPhotos}
        quoteStepMode
        quoteEmail={email}
        quoteRegistration={registration}
        quotePostcode={postcode}
        onQuoteDone={handleQuoteDone}
      />
    </div>
  );
}

function SummaryRow({ title, onEdit, children }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/70 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-white">{title}</p>
          <div className="mt-1 space-y-0.5 text-sm text-slate-300">{children}</div>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="shrink-0 rounded-md border border-cyan-300/60 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-cyan-200 transition hover:bg-cyan-400/10"
        >
          Edit
        </button>
      </div>
    </div>
  );
}