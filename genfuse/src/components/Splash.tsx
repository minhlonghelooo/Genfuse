/** Shown for the first instant (inside the server HTML), so the page is never white. Pure markup: no state, no translation. */
export default function Splash() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4" role="status" aria-busy="true" aria-label="Genfuse">
      <svg width="72" height="72" viewBox="0 0 64 64" aria-hidden className="animate-pulse text-accent">
        <circle cx="24" cy="32" r="16" fill="none" stroke="currentColor" strokeWidth="5" />
        <circle cx="40" cy="32" r="16" fill="none" stroke="currentColor" strokeWidth="5" opacity="0.55" />
      </svg>
      <p className="text-2xl font-extrabold tracking-wide">Genfuse</p>
    </main>
  );
}
