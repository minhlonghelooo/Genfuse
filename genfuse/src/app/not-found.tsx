import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-5xl" aria-hidden>🌳</p>
      <h1 className="text-2xl font-bold">Không tìm thấy trang này</h1>
      <Link href="/" className="inline-flex min-h-[44px] items-center rounded-theme bg-accent px-5 font-semibold text-accent-fg">Về Genfuse</Link>
    </main>
  );
}
