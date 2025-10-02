"use client";
import Link from "next/link";
import { useState } from "react";
import { Pacifico } from "next/font/google";
import { SignOutButton } from "@clerk/nextjs";

const pacifico = Pacifico({ weight: "400", subsets: ["latin"], variable: "--font-pacifico" });

export default function Toolbar({ showSignOut = false }: { showSignOut?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
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
      {/* Right: Sign in/account or sign out */}
      <div className="flex items-center gap-4 flex-1 justify-end">
        {showSignOut ? (
          <>
            <Link href="/dashboard" className="font-mono text-sm hover:underline">My Account</Link>
            <SignOutButton>
              <button className="px-4 py-2 rounded bg-[#ef4444] text-white font-semibold text-sm hover:bg-[#dc2626] transition">
                Sign Out
              </button>
            </SignOutButton>
          </>
        ) : (
          <>
            <button className="px-4 py-2 rounded bg-[#3b82f6] text-white font-semibold text-sm hover:bg-[#60a5fa] transition">
              <Link href="/login" className="block w-full h-full">Login</Link>
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
