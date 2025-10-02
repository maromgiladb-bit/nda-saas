"use client";
import Link from "next/link";
import { useState } from "react";
import { Pacifico } from "next/font/google";
import { SignOutButton } from "@clerk/nextjs";

const pacifico = Pacifico({ weight: "400", subsets: ["latin"], variable: "--font-pacifico" });

export default function Toolbar({ }: { showSignOut?: boolean }) {
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
                <Link href="/dashboard" className="block px-4 py-2 text-white hover:bg-[#2d4373]">Dashboard</Link>
              </li>
              <li>
                <Link href="/ndas" className="block px-4 py-2 text-white hover:bg-[#2d4373]">My NDAs</Link>
              </li>
              <li>
                <Link href="/templates" className="block px-4 py-2 text-white hover:bg-[#2d4373]">Templates</Link>
              </li>
              <li>
                <Link href="/settings" className="block px-4 py-2 text-white hover:bg-[#2d4373]">Settings</Link>
              </li>
              <li>
                <Link href="/about" className="block px-4 py-2 text-white hover:bg-[#2d4373]">About</Link>
              </li>
              <li>
                <Link href="/plans" className="block px-4 py-2 text-white hover:bg-[#2d4373]">Plans</Link>
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
        <span
          className={`text-3xl select-none ${pacifico.variable}`}
          style={{ fontFamily: 'var(--font-pacifico), cursive' }}
        >
          CONFIDO
        </span>
      </div>
      {/* Right: Sign out */}
      <div className="flex items-center gap-4 flex-1 justify-end">
        <Link href="/dashboard" className="px-4 py-2 rounded bg-[#3b82f6] text-white font-semibold text-sm hover:bg-[#60a5fa] transition">
          My Account
        </Link>
        <SignOutButton>
          <button className="px-4 py-2 rounded bg-[#ef4444] text-white font-semibold text-sm hover:bg-[#dc2626] transition">
            Sign Out
          </button>
        </SignOutButton>
      </div>
    </nav>
  );
}
