"use client";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push("/dashboard");
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return <div className="min-h-screen">Loading...</div>;
  }

  if (isSignedIn) {
    return <div className="min-h-screen">Redirecting to dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="pt-20 pb-16 text-center lg:pt-32">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Create Professional NDAs
            <span className="text-blue-600"> Effortlessly</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
            Streamline your confidentiality agreements with our intuitive NDA creation platform. 
            Generate, customize, and manage NDAs with just a few clicks.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <button
              onClick={() => router.push("/signup")}
              className="rounded-md bg-blue-600 px-6 py-3 text-lg font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Get Started Free
            </button>
            <button
              onClick={() => router.push("/about")}
              className="text-lg font-semibold leading-6 text-gray-900 hover:text-blue-600"
            >
              Learn more <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-16">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Easy Creation</h3>
              <p className="text-gray-600">Create professional NDAs in minutes with our step-by-step wizard and pre-built templates.</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Digital Signatures</h3>
              <p className="text-gray-600">Send NDAs for electronic signatures and track signing status in real-time.</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure & Compliant</h3>
              <p className="text-gray-600">Bank-level security and legal compliance to protect your confidential information.</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-blue-600 rounded-2xl py-16 px-8 text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to streamline your NDAs?
          </h2>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of businesses who trust our platform for their confidentiality agreements.
          </p>
          <button
            onClick={() => router.push("/signup")}
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Start Creating NDAs Today
          </button>
        </div>
      </main>
    </div>
  );
}
