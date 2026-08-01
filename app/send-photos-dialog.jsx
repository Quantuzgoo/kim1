"use client";

import { useEffect, useRef, useState } from "react";

const totalSlots = 8;
const slotGroups = [
  [1, 2, 3, 4],
  [5, 6, 7, 8],
];

export default function SendPhotosDialog({
  open,
  onClose,
  quoteStepMode = false,
  quoteEmail = "",
  quoteRegistration = "",
  quotePostcode = "",
  onQuoteDone,
}) {
  const [activePhotoSlide, setActivePhotoSlide] = useState(0);
  const [slotImages, setSlotImages] = useState(Array(totalSlots).fill(null));
  const [slotDescriptions, setSlotDescriptions] = useState(Array(totalSlots).fill(""));
  const [isCameraCaptureOpen, setIsCameraCaptureOpen] = useState(false);
  const [cameraTargetSlotIndex, setCameraTargetSlotIndex] = useState(null);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState(null);
  const [cameraError, setCameraError] = useState("");
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const fallbackCameraInputRef = useRef(null);

  const stopCameraStream = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }

    setIsCameraReady(false);

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const closeCameraCapture = ({ keepCapturedPreview = false } = {}) => {
    stopCameraStream();

    if (!keepCapturedPreview && capturedPhotoUrl) {
      URL.revokeObjectURL(capturedPhotoUrl);
    }

    setCapturedPhotoUrl(null);
    setCameraError("");
    setIsCameraCaptureOpen(false);
    setCameraTargetSlotIndex(null);

    if (fallbackCameraInputRef.current) {
      fallbackCameraInputRef.current.value = "";
    }
  };

  const handleCloseSendPhotos = () => {
    if (isCameraCaptureOpen) {
      closeCameraCapture();
    }

    onClose();
  };

  const openFallbackCameraPicker = () => {
    if (fallbackCameraInputRef.current) {
      fallbackCameraInputRef.current.click();
    }
  };

  useEffect(() => {
    if (!isCameraCaptureOpen || capturedPhotoUrl) {
      return;
    }

    let cancelled = false;

    const startCamera = async () => {
      setIsCameraReady(false);

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("Live camera preview is not supported on this device. Using camera picker instead.");
        openFallbackCameraPicker();
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        cameraStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setIsCameraReady(true);
        }
      } catch {
        setIsCameraReady(false);
        setCameraError("Could not access camera preview. Using camera picker instead.");
        openFallbackCameraPicker();
      }
    };

    startCamera();

    return () => {
      cancelled = true;
      stopCameraStream();
    };
  }, [isCameraCaptureOpen, capturedPhotoUrl]);

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
    const input = document.getElementById(`quote-slot-upload-${slotIndex}`);
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
    setCameraTargetSlotIndex(slotIndex);
    setCapturedPhotoUrl(null);
    setCameraError("");
    setIsCameraCaptureOpen(true);
  };

  const handleCaptureFromCamera = () => {
    if (!videoRef.current || !canvasRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const width = video.videoWidth;
    const height = video.videoHeight;

    if (!width || !height) {
      return;
    }

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.drawImage(video, 0, 0, width, height);
    canvas.toBlob((blob) => {
      if (!blob) {
        return;
      }

      if (capturedPhotoUrl) {
        URL.revokeObjectURL(capturedPhotoUrl);
      }

      setCapturedPhotoUrl(URL.createObjectURL(blob));
    }, "image/jpeg", 0.92);
  };

  const handleConfirmCapturedPhoto = () => {
    if (cameraTargetSlotIndex === null || !capturedPhotoUrl) {
      return;
    }

    const photoToKeep = capturedPhotoUrl;
    setSlotImages((current) => {
      const next = [...current];
      if (next[cameraTargetSlotIndex]) {
        URL.revokeObjectURL(next[cameraTargetSlotIndex]);
      }
      next[cameraTargetSlotIndex] = photoToKeep;
      return next;
    });

    stopCameraStream();
    setCapturedPhotoUrl(null);
    setCameraError("");
    setIsCameraCaptureOpen(false);
    setCameraTargetSlotIndex(null);
    if (fallbackCameraInputRef.current) {
      fallbackCameraInputRef.current.value = "";
    }
  };

  const handleRetakeCapturedPhoto = () => {
    if (capturedPhotoUrl) {
      URL.revokeObjectURL(capturedPhotoUrl);
      setCapturedPhotoUrl(null);
    }

    if (!cameraStreamRef.current) {
      openFallbackCameraPicker();
    }
  };

  const handleFallbackCameraUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      return;
    }

    if (capturedPhotoUrl) {
      URL.revokeObjectURL(capturedPhotoUrl);
    }

    setCapturedPhotoUrl(URL.createObjectURL(file));
    setIsCameraCaptureOpen(true);
  };

  const handleImageUpload = (slotIndex, event) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
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

  const handleSubmitPhotos = async ({ closeOnSuccess = false } = {}) => {
    const filledSlots = slotImages
      .map((url, index) => ({ url, index }))
      .filter((slot) => slot.url);

    if (filledSlots.length === 0) {
      setUploadMessage("Add at least one photo before sending.");
      return;
    }

    setIsUploadingPhotos(true);
    setUploadMessage("");

    try {
      const formData = new FormData();
      for (const slot of filledSlots) {
        const blob = await fetch(slot.url).then((response) => response.blob());
        formData.append("photos", blob, `slot-${slot.index + 1}.jpg`);
        formData.append("descriptions", slotDescriptions[slot.index] || "");
      }

      const response = await fetch("/api/photos", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (response.status === 401) {
        setUploadMessage("Please log in (top right) to send your photos.");
        return;
      }
      if (!response.ok) {
        setUploadMessage(data.error || "Upload failed. Please try again.");
        return;
      }

      setUploadMessage(`Sent ${data.saved} photo${data.saved === 1 ? "" : "s"}! View them in My Account.`);

      if (closeOnSuccess) {
        handleCloseSendPhotos();
      }
    } catch {
      setUploadMessage("Could not reach the server. Please try again.");
    } finally {
      setIsUploadingPhotos(false);
    }
  };

  const handleQuoteDone = async () => {
    const email = String(quoteEmail || "").trim().toLowerCase();
    const registration = String(quoteRegistration || "").trim().toUpperCase();
    const postcode = String(quotePostcode || "").trim().toUpperCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setUploadMessage("Please add a valid email in Step 1 first.");
      return;
    }

    if (!registration || !postcode) {
      setUploadMessage("Please add registration and postcode in Step 1 first.");
      return;
    }

    setIsUploadingPhotos(true);
    setUploadMessage("");

    try {
      const response = await fetch("/api/quote-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, registration, postcode }),
      });
      const data = await response.json();

      if (!response.ok) {
        setUploadMessage(data.error || "Could not save your quote reference. Please try again.");
        return;
      }

      if (typeof onQuoteDone === "function") {
        onQuoteDone(data);
      }

      handleCloseSendPhotos();
    } catch {
      setUploadMessage("Could not reach the server. Please try again.");
    } finally {
      setIsUploadingPhotos(false);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <>
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
                  onClick={handleCloseSendPhotos}
                  aria-label="Close Send Photos dialog"
                  title="Close"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/90 bg-[#ff0000]/35 text-white transition hover:bg-[#ff0000]/35 hover:opacity-50"
                >
                  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-4 w-4">
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
                              id={`quote-slot-upload-${slotIndex}`}
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
                aria-label="Open camera upload"
                title="Camera"
                className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-full border border-black bg-black text-white transition hover:bg-black hover:opacity-50"
              >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-8 w-8">
                  <path
                    d="M8.5 7.5L10 5h4l1.5 2.5H18a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9.5a2 2 0 0 1 2-2h2.5Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="13" r="3" stroke="currentColor" strokeWidth="1.8" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setActivePhotoSlide((current) => Math.min(slotGroups.length - 1, current + 1))}
                disabled={activePhotoSlide === slotGroups.length - 1}
                className="rounded-md bg-cyan-400 px-[clamp(0.6rem,1.5vmin,1rem)] py-[clamp(0.35rem,1vmin,0.6rem)] text-[clamp(0.7rem,1.4vmin,0.9rem)] font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="min-h-5 text-sm text-cyan-200">{uploadMessage}</p>
              <button
                type="button"
                onClick={quoteStepMode ? handleQuoteDone : () => handleSubmitPhotos()}
                disabled={isUploadingPhotos}
                className="rounded-md bg-emerald-400 px-[clamp(0.6rem,1.5vmin,1rem)] py-[clamp(0.35rem,1vmin,0.6rem)] text-[clamp(0.7rem,1.4vmin,0.9rem)] font-bold uppercase tracking-wide text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isUploadingPhotos
                  ? quoteStepMode
                    ? "Saving..."
                    : "Sending..."
                  : quoteStepMode
                    ? "Done"
                    : "Send to Nova Bodyworks"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {isCameraCaptureOpen && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/85 px-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeCameraCapture();
            }
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeCameraCapture();
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Camera preview"
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-white/15 bg-slate-900 p-4 shadow-2xl shadow-cyan-950/40 sm:p-6"
            onMouseDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <h3 className="font-display text-xl font-bold text-white sm:text-2xl">Camera Preview</h3>
            </div>

            {cameraError && <p className="mt-3 text-sm text-amber-300">{cameraError}</p>}

            <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-black">
              {capturedPhotoUrl ? (
                <img
                  src={capturedPhotoUrl}
                  alt="Captured preview"
                  className="h-[min(60vh,28rem)] w-full object-contain"
                />
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="h-[min(60vh,28rem)] w-full object-cover"
                />
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" />
            <input
              ref={fallbackCameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFallbackCameraUpload}
            />

            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              {capturedPhotoUrl ? (
                <>
                  <button
                    type="button"
                    onClick={handleRetakeCapturedPhoto}
                    className="rounded-md border border-white/25 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Retake
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmCapturedPhoto}
                    className="rounded-md bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
                  >
                    Keep Image
                  </button>
                </>
              ) : (
                <div className="relative w-full min-h-10">
                  <button
                    type="button"
                    onClick={() => closeCameraCapture()}
                    className="absolute right-0 top-1/2 -translate-y-1/2 rounded-md border border-white/25 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCaptureFromCamera}
                    disabled={!isCameraReady}
                    aria-label="Take photo"
                    title="Take Photo"
                    className="absolute left-1/2 top-1/2 inline-flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/90 bg-[#ff0000]/35 text-white transition hover:bg-[#ff0000]/35 hover:opacity-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <span className="sr-only">Take Photo</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}