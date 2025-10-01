
"use client";
import Link from "next/link";
import { useState } from "react";

import { Pacifico } from "next/font/google";
const pacifico = Pacifico({ weight: "400", subsets: ["latin"], variable: "--font-pacifico" });

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
  <div className="font-sans min-h-screen bg-white text-[#1a2940]">
      {/* Top bar */}
  <nav className="flex items-center justify-between px-6 py-4 border-b bg-[#1a2940] text-white">
  {/* Left: Dropdown menu */}
  <div className="relative flex-1">
          <button
            className="px-4 py-2 rounded bg-[#233366] hover:bg-[#2d4373] font-medium text-sm flex items-center gap-2 transition text-white"
            onClick={() => setMenuOpen((open) => !open)}
            aria-haspopup="true"
            aria-expanded={menuOpen}
          >
            {/* Hamburger icon: three horizontal lines */}
            <span aria-hidden>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect y="5" width="24" height="2" rx="1" fill="white" />
                <rect y="11" width="24" height="2" rx="1" fill="white" />
                <rect y="17" width="24" height="2" rx="1" fill="white" />
              </svg>
            </span>
            Menu
          </button>
          {menuOpen && (
            <div className="absolute left-0 mt-2 w-48 rounded shadow-lg bg-[#233366] border border-[#1a2940] z-10">
              <ul className="py-2">
                <li>
                  <Link href="/about" className="block px-4 py-2 text-white hover:bg-[#2d4373]">About</Link>
                </li>
                <li>
                  <a href="#" className="block px-4 py-2 text-blue-200 cursor-not-allowed">Choose Your Plan</a>
                </li>
                <li>
                  <a href="#" className="block px-4 py-2 text-blue-200 cursor-not-allowed">Settings</a>
                </li>
                <li>
                  <a href="#" className="block px-4 py-2 text-blue-200 cursor-not-allowed">Contact</a>
                </li>
              </ul>
            </div>
          )}
        </div>
        {/* Center: Company name */}
        <div className="flex-1 flex justify-center">
          <span
            className={`text-3xl select-none ${pacifico.variable}`}
            style={{ fontFamily: 'var(--font-pacifico), cursive' }}
          >
            CONFIDO
          </span>
        </div>
        {/* Right: Sign in and account */}
        <div className="flex items-center gap-4 flex-1 justify-end">
          <span className="font-mono text-sm">My Account</span>
          <button className="px-4 py-2 rounded bg-[#2563eb] text-white font-semibold text-sm hover:bg-[#1e40af] transition">Sign In</button>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex flex-col gap-8 items-center justify-center min-h-[80vh] p-8 bg-white border border-[#e5e7eb] rounded-xl shadow-md mx-4 mt-8">
  <h1 className="text-3xl font-bold text-[#1a2940] text-center mb-2 mt-2">Fast, Secure, and Hassle-Free NDAs.</h1>
        <p className="text-lg text-[#233366] text-center mb-4">CONFIDO helps companies create, negotiate, and sign NDAs in minutes — not days.</p>
        <button
          className="bg-[#2563eb] hover:bg-[#1e40af] text-white font-semibold text-lg px-6 py-3 rounded-full shadow transition mb-6"
        >
          Get Started Free
        </button>

        {/* Key Benefits section */}
        <section className="w-full flex flex-col items-center mt-2 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
            <div className="bg-[#f3f6fb] border border-[#e0e7ff] rounded-xl p-6 text-center shadow-sm">
              <h3 className="text-xl font-bold text-[#1a2940] mb-2">Save Time</h3>
              <p className="text-base text-[#233366]">Stop rewriting the same NDA. Use templates and send instantly. Read only the relevant parts.</p>
            </div>
            <div className="bg-[#f3f6fb] border border-[#e0e7ff] rounded-xl p-6 text-center shadow-sm">
              <h3 className="text-xl font-bold text-[#1a2940] mb-2">Negotiate Smarter</h3>
              <p className="text-base text-[#233366]">Counterparties can propose changes with track-changes, so review is simple.</p>
            </div>
            <div className="bg-[#f3f6fb] border border-[#e0e7ff] rounded-xl p-6 text-center shadow-sm">
              <h3 className="text-xl font-bold text-[#1a2940] mb-2">Stay Secure</h3>
              <p className="text-base text-[#233366]">Every NDA is encrypted, logged, and safely stored.</p>
            </div>
          </div>
        </section>

        {/* How It Works section */}
        <section className="w-full flex flex-col items-center mb-8">
          <h2 className="text-2xl font-bold text-[#1a2940] text-center mb-4">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full max-w-4xl">
            <div className="bg-white border border-[#e0e7ff] rounded-xl p-6 text-center shadow-sm">
              <h3 className="text-lg font-semibold text-[#233366] mb-2">Choose a Template</h3>
              <p className="text-base text-[#233366]">Start with your standard NDA.</p>
            </div>
            <div className="bg-white border border-[#e0e7ff] rounded-xl p-6 text-center shadow-sm">
              <h3 className="text-lg font-semibold text-[#233366] mb-2">Fill &amp; Send</h3>
              <p className="text-base text-[#233366]">Add names, dates, and details in seconds.</p>
            </div>
            <div className="bg-white border border-[#e0e7ff] rounded-xl p-6 text-center shadow-sm">
              <h3 className="text-lg font-semibold text-[#233366] mb-2">Negotiate or Sign</h3>
              <p className="text-base text-[#233366]">Counterparty can suggest edits or sign immediately.</p>
            </div>
            <div className="bg-white border border-[#e0e7ff] rounded-xl p-6 text-center shadow-sm">
              <h3 className="text-lg font-semibold text-[#233366] mb-2">Track Progress</h3>
              <p className="text-base text-[#233366]">See statuses, reminders, and a full audit trail.</p>
            </div>
          </div>
        </section>
        {/* ...removed Next.js logo and instructions... */}
      </main>
    </div>
  );
}
