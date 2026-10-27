'use client';

/** If a screen crashes, the person sees a way back instead of a blank page. */
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-5xl" aria-hidden>🛠️</p>
      <h1 className="text-2xl font-bold">Genfuse gặp sự cố nhỏ</h1>
      <p className="text-muted">Dữ liệu gia đình vẫn an toàn. Hãy thử tải lại.</p>
      <button onClick={reset} className="min-h-[44px] rounded-theme bg-accent px-5 font-semibold text-accent-fg">Thử lại</button>
    </main>
  );
}
