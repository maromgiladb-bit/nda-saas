"use client";
import Link from "next/link";

export default function Contact() {
  return (
    <div className="font-sans min-h-screen bg-white text-[#1a2940]">
      
      <main className="flex flex-col gap-8 items-center justify-center min-h-[80vh] p-8 bg-white border border-[#e5e7eb] rounded-xl shadow-md mx-4 mt-8">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-[#1a2940] text-center">Contact Us</h1>
          <p className="text-lg text-[#233366] text-center mt-2">For demo purposes, this contact page is a placeholder.</p>
        </header>
        <section className="max-w-2xl w-full mx-auto">
          <p className="mb-4 text-base text-[#233366] text-center">
            You can reach us at <span className="font-mono">demo@example.com</span> (not a real address).
          </p>
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
