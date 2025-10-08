"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import PublicToolbar from "@/components/PublicToolbar";

export default function Dashboard() {
  const router = useRouter();
  const { user } = useUser();
  const [draftCount, setDraftCount] = useState(0);

  // Load draft count from localStorage on client side only
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const drafts = JSON.parse(localStorage.getItem("ndaDrafts") || "[]");
        setDraftCount(drafts.length);
      } catch {
        setDraftCount(0);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicToolbar />
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Welcome to your Dashboard
          </h1>
          
          {user && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">
                Hello, {user.firstName || user.emailAddresses[0]?.emailAddress}!
              </h2>
              <p className="text-gray-600">
                Manage your NDAs and account settings from here.
              </p>
            </div>
          )}

          {/* Quick Stats */}
          <div className="mb-8 border-b pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {draftCount}
                </div>
                <div className="text-sm text-gray-600">Total Drafts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">0</div>
                <div className="text-sm text-gray-600">Signed NDAs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">0</div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">0</div>
                <div className="text-sm text-gray-600">Templates</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Drafts Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <div className="bg-blue-600 text-white p-3 rounded-lg">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 ml-3">My NDAs</h3>
              </div>
              <p className="text-gray-600 mb-4">
                View and manage your draft NDAs, continue editing, or create new ones.
              </p>
              <button
                onClick={() => router.push("/mynda")}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                View Drafts
              </button>
            </div>

            {/* Create New NDA Card */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <div className="bg-green-600 text-white p-3 rounded-lg">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 ml-3">Create NDA</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Start a new NDA document with our easy-to-use template.
              </p>
              <button
                onClick={() => router.push("/newnda")}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Create New
              </button>
            </div>

            {/* Account Settings Card */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <div className="bg-purple-600 text-white p-3 rounded-lg">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 ml-3">Account</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Manage your account settings, billing, and preferences.
              </p>
              <button
                onClick={() => window.alert("Account settings coming soon!")}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
