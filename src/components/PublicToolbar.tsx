"use client";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { Pacifico } from "next/font/google";
import { useUser, UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

const pacifico = Pacifico({ weight: "400", subsets: ["latin"], variable: "--font-pacifico" });

export default function Toolbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  // Close login modal when embed signals sign-in complete (postMessage)
  useEffect(() => {
    function onMessage(ev: MessageEvent) {
      try {
        if (!ev.data || ev.data.type !== "clerk:signed_in") return;
        setShowLogin(false);
        setShowSignup(false);
        // Use a small delay to ensure Clerk state is synced, then force reload
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 100);
      } catch {
        // ignore
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [router]);
  
  // Show loading state while checking authentication
  if (!isLoaded) {
    return (
      <nav className="flex items-center justify-between px-6 py-4 border-b bg-[#1a2940] text-white">
        <div className="flex-1"></div>
        <div className="flex-1 flex justify-center">
          <span
            className={`text-3xl select-none ${pacifico.variable}`}
            style={{ fontFamily: 'var(--font-pacifico), cursive' }}
          >
            CONFIDO
          </span>
        </div>
        <div className="flex-1"></div>
      </nav>
    );
  }

  return (
    <>
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
              {/* Public pages - always shown */}
              <li>
                <Link href="/about" className="block px-4 py-2 text-white hover:bg-[#2d4373]">About</Link>
              </li>
              <li>
                <Link href="/plans" className="block px-4 py-2 text-white hover:bg-[#2d4373]">Choose Your Plan</Link>
              </li>
              <li>
                <Link href="/contact" className="block px-4 py-2 text-white hover:bg-[#2d4373]">Contact</Link>
              </li>
              
              {/* Private pages - only shown when signed in */}
              {isSignedIn && (
                <>
                  <li className="border-t border-[#2d4373] mt-2 pt-2">
                    <Link href="/dashboard" className="block px-4 py-2 text-white hover:bg-[#2d4373]">Dashboard</Link>
                  </li>
                  <li>
                    <Link href="/newnda" className="block px-4 py-2 text-white hover:bg-[#2d4373]">Create NDA</Link>
                  </li>
                  <li>
                    <Link href="/mynda" className="block px-4 py-2 text-white hover:bg-[#2d4373]">My NDAs</Link>
                  </li>
                  <li>
                    <a href="#" className="block px-4 py-2 text-blue-200 cursor-not-allowed">Settings</a>
                  </li>
                </>
              )}
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
      
      {/* Right: Authentication section */}
      <div className="flex items-center gap-4 flex-1 justify-end">
        {isSignedIn ? (
          <>
            <Link href="/dashboard" className="font-mono text-sm hover:underline">My Account</Link>
            <UserButton />
          </>
        ) : (
          <>
            <button
              onClick={() => {
                setShowSignup(false);
                setShowLogin(true);
              }}
              className="px-4 py-2 rounded bg-[#3b82f6] text-white font-semibold text-sm hover:bg-[#60a5fa] transition"
            >
              Login
            </button>
            <button
              onClick={() => {
                setShowLogin(false);
                setShowSignup(true);
              }}
              className="px-4 py-2 rounded bg-white text-[#1a2940] font-semibold text-sm hover:bg-gray-100 border ml-2 transition"
            >
              Sign up
            </button>
          </>
        )}
      </div>
  </nav>
    {showLogin && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="relative w-[92vw] max-w-[900px] h-[86vh] bg-white rounded-lg shadow-lg overflow-hidden">
          <button
            onClick={() => setShowLogin(false)}
            aria-label="Close login"
            className="absolute right-3 top-3 z-20 bg-white rounded-full p-1 shadow hover:bg-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 011.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <iframe
            id="clerk-login-iframe"
            title="Login"
            src="/login/embed/"
            className="w-full h-full border-0"
          />
        </div>
      </div>
    )}
    {showSignup && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="relative w-[92vw] max-w-[900px] h-[86vh] bg-white rounded-lg shadow-lg overflow-hidden">
          <button
            onClick={() => setShowSignup(false)}
            aria-label="Close signup"
            className="absolute right-3 top-3 z-20 bg-white rounded-full p-1 shadow hover:bg-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 011.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <iframe
            id="clerk-signup-iframe"
            title="Sign up"
            src="/signup/embed/"
            className="w-full h-full border-0"
          />
        </div>
      </div>
    )}
    </>
  );
}

// done
