import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "About - NDA SaaS",
  description: "About page for the NDA SaaS demo application.",
};

export default function About() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <main className="max-w-3xl w-full prose dark:prose-invert">
        <header className="mb-6">
          <h1 className="text-3xl font-semibold">About NDA SaaS</h1>
          <p className="text-sm text-muted-foreground mt-2">A tiny demo site built with Next.js app directory.</p>
        </header>

        <section>
          <p>
            NDA SaaS is a fictional demo application illustrating a minimal Next.js (app dir)
            setup with TypeScript and Tailwind via PostCSS. This page is intentionally simple — it
            describes the project and common extension points an agent might edit.
          </p>

          <p>
            The site uses server components by default under `src/app`, `next/font/google` for
            font variables, and `next/image` for static assets stored in `public/`.
          </p>
        </section>

        <section className="mt-6">
          <h2 className="text-xl font-medium">Made-up features</h2>
          <ul>
            <li>Multi-tenant NDA generation (demo placeholder)</li>
            <li>Template library with versioning and audit logs</li>
            <li>Simple deployment workflow tuned for Vercel</li>
          </ul>
        </section>

        <figure className="mt-6">
          <Image src="/next.svg" alt="Next.js" width={240} height={48} className="dark:invert" />
          <figcaption className="text-xs text-muted-foreground mt-2">Powered by Next.js</figcaption>
        </figure>

        <footer className="mt-8">
          <Link href="/" className="text-sm underline">
            ← Back to home
          </Link>
        </footer>
      </main>
    </div>
  );
}
