import Link from "next/link";

export default function About() {
  return (
    <div className="font-sans min-h-screen bg-white text-[#1a2940]">
      
      <main className="flex flex-col gap-8 items-center justify-center min-h-[80vh] p-8 bg-white border border-[#e5e7eb] rounded-xl shadow-md mx-4 mt-8">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-[#1a2940] text-center">About NDA SaaS</h1>
          <p className="text-lg text-[#233366] text-center mt-2">A tiny demo site built with Next.js app directory.</p>
        </header>
        <section className="max-w-2xl w-full mx-auto">
          <p className="mb-4 text-base text-[#233366] text-center">
            NDA SaaS is a fictional demo application illustrating a minimal Next.js (app dir)
            setup with TypeScript and Tailwind via PostCSS. This page is intentionally simple — it describes the project and common extension points an agent might edit.
          </p>
          <p className="mb-4 text-base text-[#233366] text-center">
            The site uses server components by default under <code className="bg-[#e0e7ff] text-[#1a2940] px-1 rounded">src/app</code>, <code className="bg-[#e0e7ff] text-[#1a2940] px-1 rounded">next/font/google</code> for
            font variables, and <code className="bg-[#e0e7ff] text-[#1a2940] px-1 rounded">next/image</code> for static assets stored in <code className="bg-[#e0e7ff] text-[#1a2940] px-1 rounded">public/</code>.
          </p>
        </section>
        <section className="mt-6 max-w-2xl w-full mx-auto">
          <h2 className="text-xl font-medium text-[#1a2940] text-center mb-2">Made-up features</h2>
          <ul className="list-disc list-inside text-[#233366] text-base text-center">
            <li>Multi-tenant NDA generation (demo placeholder)</li>
            <li>Template library with versioning and audit logs</li>
            <li>Simple deployment workflow tuned for Vercel</li>
          </ul>
        </section>
        <footer className="mt-8">
          <Link href="/" className="text-sm underline">
            ← Back to home
          </Link>
        </footer>
      </main>
    </div>
  );
}
