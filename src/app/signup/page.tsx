"use client";
import Link from "next/link";
import { useState } from "react";
import { Pacifico } from "next/font/google";
import { SignUp } from "@clerk/nextjs";
const pacifico = Pacifico({ weight: "400", subsets: ["latin"], variable: "--font-pacifico" });

export default function Signup() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="font-sans min-h-screen bg-white text-[#1a2940]">
      {/* Top bar (copied from homepage) */}
      <nav className="flex items-center justify-between px-6 py-4 border-b bg-[#1a2940] text-white">
        {/* Left: Dropdown menu */}
        <div className="relative flex-1">
          <button
            className="px-4 py-2 rounded bg-[#233366] hover:bg-[#2d4373] font-medium text-sm flex items-center gap-2 transition text-white"
            onClick={() => setMenuOpen((open) => !open)}
            aria-haspopup="true"
            aria-expanded={menuOpen}
          >
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
            <div className="absolute left-0 mt-2 w-48 bg-[#233366] rounded shadow-lg z-10">
              <ul className="py-2">
                <li>
                  <Link href="/about" className="block px-4 py-2 text-white hover:bg-[#2d4373]">About</Link>
                </li>
                <li>
                  <Link href="/plans" className="block px-4 py-2 text-white hover:bg-[#2d4373]">Choose Your Plan</Link>
                </li>
                <li>
                  <a href="#" className="block px-4 py-2 text-blue-200 cursor-not-allowed">Settings</a>
                </li>
                <li>
                  <Link href="/contact" className="block px-4 py-2 text-white hover:bg-[#2d4373]">Contact</Link>
                </li>
              </ul>
            </div>
          )}
        </div>
        {/* Center: Company name */}
        <div className="flex-1 flex justify-center">
          <Link href="/" className="focus:outline-none">
            <span
              className={`text-3xl select-none ${pacifico.variable} hover:underline`}
              style={{ fontFamily: 'var(--font-pacifico), cursive' }}
            >
              CONFIDO
            </span>
          </Link>
        </div>
        {/* Right: Sign in and account */}
        <div className="flex items-center gap-4 flex-1 justify-end">
          <span className="font-mono text-sm">My Account</span>
          <button className="px-4 py-2 rounded bg-[#3b82f6] text-white font-semibold text-sm hover:bg-[#60a5fa] transition">
            <Link href="/login" className="block w-full h-full">Sign Up</Link>
          </button>
        </div>
      </nav>
      {/* Main content */}
      <main className="flex flex-col gap-8 items-center justify-center min-h-[80vh] p-8 bg-white border border-[#e5e7eb] rounded-xl shadow-md mx-4 mt-8">
        <h1 className="text-3xl font-bold text-[#1a2940] text-center mb-2 mt-2">Sign Up</h1>
        <div className="w-full max-w-md mx-auto bg-[#f3f6fb] border border-[#e0e7ff] rounded-xl p-6 text-center shadow-sm">
          <SignUp path="/signup" routing="path" afterSignUpUrl="/dashboard" />
        </div>
      </main>
    </div>
  );
}
