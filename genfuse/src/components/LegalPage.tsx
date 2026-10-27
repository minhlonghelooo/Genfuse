import Link from 'next/link';

/** Shared frame for the legal pages (plain server markup, no JavaScript needed). */
export default function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-2xl p-4 pb-16">
      <Link href="/" className="inline-flex min-h-[44px] items-center font-semibold text-accent underline">← Genfuse</Link>
      <h1 className="mt-2 text-3xl font-bold">{title}</h1>
      <p className="mb-6 text-sm text-muted">Cập nhật lần cuối: {updated}</p>
      <div className="card space-y-4 leading-relaxed [&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-bold [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6">{children}</div>
    </main>
  );
}
