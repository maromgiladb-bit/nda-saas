"use client";
import React from "react";
import PublicToolbar from "@/components/PublicToolbar";

export default function AboutUs() {

  return (
    <div className="min-h-screen bg-white text-[#1a2940] flex flex-col">
      <PublicToolbar />
      <div className="flex flex-col items-center py-12 px-4">
        <main className="flex flex-col gap-8 items-center justify-center w-full max-w-3xl mx-auto">
          <div className="bg-white border border-[#2563eb] rounded-xl p-8 shadow-md w-full flex flex-col items-center">
            <h1 className="text-4xl font-extrabold mb-4 text-blue-700 flex items-center gap-3">
              <span role="img" aria-label="logo">🧩</span> About NDA Helper
            </h1>
            <p className="mb-2 text-lg text-gray-700 text-center">
              At NDA Helper, we cut out the wasted time and back-and-forth that slow deals down.<br />
              Our platform lets everyone sign the same trusted NDA template — so there’s no need to review or rewrite the same clauses again and again.
            </p>
            <p className="mb-2 text-lg text-gray-700 text-center">
              You just fill in the key details, send, and sign.<br />
              <span className="font-bold text-blue-600">Minutes instead of days.</span>
            </p>
        </div>

        <div className="bg-white border border-[#2563eb] rounded-xl p-8 shadow-md w-full flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-3 text-green-700 flex items-center gap-2">
            <span role="img" aria-label="mission">🎯</span> Our Mission
          </h2>
           <p className="text-lg text-gray-700 text-center mb-2">
            Simplify confidentiality. Save your time.<br />
            We believe legal agreements shouldn’t hold up progress.<br />
            By using a single, verified NDA template, we remove unnecessary reviews and let teams focus on what really matters — starting the work, not debating the paperwork.
          </p>
        </div>

        <div className="bg-white border border-[#2563eb] rounded-xl p-8 shadow-md w-full flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-3 text-purple-700 flex items-center gap-2">
            <span role="img" aria-label="how">⚙️</span> How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mt-2">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span role="img" aria-label="template">🧩</span>
                <span className="font-semibold">One universal template</span>
              </div>
              <p className="text-lg text-gray-700">All parties use the same professional NDA format. The only fields you fill are the ones that actually change — company names, dates, and project details.</p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span role="img" aria-label="fast">⚡</span>
                <span className="font-semibold">Fast online filling and signing</span>
              </div>
              <p className="text-lg text-gray-700">Skip the printing, scanning, and redlines. Fill the NDA directly in your browser and send for signature instantly.</p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span role="img" aria-label="save">💾</span>
                <span className="font-semibold">Save and edit drafts anytime</span>
              </div>
              <p className="text-lg text-gray-700">Pick up right where you left off — no version confusion, no “final-final-v2.pdf” emails.</p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span role="img" aria-label="document">📄</span>
                <span className="font-semibold">Instant final document</span>
              </div>
              <p className="text-lg text-gray-700">Once signed, you get a verified, timestamped copy ready to download or share.</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#2563eb] rounded-xl p-8 shadow-md w-full flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-3 text-blue-700 flex items-center gap-2">
            <span role="img" aria-label="why">💡</span> Why Choose NDA Helper
          </h2>
          <ul className="list-disc pl-6 text-lg text-gray-700 space-y-2 w-full">
            <li>No reviews, no rewrites — everyone trusts the same standardized NDA.</li>
            <li>Speed that fits real business — create, sign, and finish in minutes.</li>
            <li>Security and compliance — encrypted storage and full audit trails.</li>
            <li>Professional results — every agreement looks consistent and legally solid.</li>
          </ul>
          <p className="mt-4 text-lg text-gray-700 text-center">
            You protect your ideas, we protect your time.
          </p>
        </div>

        <div className="bg-white border border-[#2563eb] rounded-xl p-8 shadow-md w-full flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-3 text-pink-700 flex items-center gap-2">
            <span role="img" aria-label="vision">🌟</span> Our Vision
          </h2>
          <p className="text-lg text-gray-700 text-center">
            We’re rethinking how legal agreements work.<br />
            By standardizing NDAs, we’re turning what used to be a slow, repetitive task into a fast, reliable handshake.<br />
            The future of business agreements is simple, shared, and instant — and NDA Helper is leading the way.
          </p>
        </div>

        <div className="bg-blue-50 border border-[#2563eb] rounded-xl p-8 shadow-md w-full flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-3 text-blue-700 flex items-center justify-center gap-2">
            <span role="img" aria-label="start">🚀</span> Start in Minutes
          </h2>
          <p className="mb-6 text-lg text-gray-700 text-center">
            Stop waiting for signatures and start moving faster.<br />
            Create and sign your NDA today — no setup, no review cycles, no wasted time.
          </p>
          <a href="/newnda" className="inline-block bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg shadow hover:bg-blue-700 transition">👉 Start Now — finish your NDA before the meeting even starts.</a>
        </div>
      </main>
      </div>
    </div>
  );
}
