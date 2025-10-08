"use client";
import React from "react";
import Link from "next/link";
import PublicToolbar from "@/components/PublicToolbar";

export default function Plans() {
  return (
    <div>
      <PublicToolbar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header Section */}
        <section className="pt-16 pb-12 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Choose Your Plan
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Select the perfect plan for your NDA needs. Start with our free option or unlock premium features for your business.
            </p>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="pb-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              
              {/* Free Plan */}
              <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
                  <div className="text-4xl font-bold text-gray-900 mb-4">
                    $0<span className="text-lg font-normal text-gray-600">/month</span>
                  </div>
                  <p className="text-gray-600 mb-6">Perfect for individuals and small projects</p>
                </div>
                
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-3">✓</span>
                    Up to 3 NDAs per month
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-3">✓</span>
                    Basic template
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-3">✓</span>
                    PDF download
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-3">✓</span>
                    Email support
                  </li>
                </ul>
                
                <Link href="/newnda">
                  <button className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                    Get Started Free
                  </button>
                </Link>
              </div>

              {/* Pro Plan - Most Popular */}
              <div className="bg-white rounded-xl shadow-xl p-8 border-2 border-blue-500 relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
                
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Pro</h3>
                  <div className="text-4xl font-bold text-blue-600 mb-4">
                    $29<span className="text-lg font-normal text-gray-600">/month</span>
                  </div>
                  <p className="text-gray-600 mb-6">Ideal for small to medium businesses</p>
                </div>
                
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-3">✓</span>
                    Unlimited NDAs
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-3">✓</span>
                    Advanced templates
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-3">✓</span>
                    Custom branding
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-3">✓</span>
                    E-signature integration
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-3">✓</span>
                    Priority support
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-3">✓</span>
                    Analytics dashboard
                  </li>
                </ul>
                
                <Link href="/newnda">
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                    Start Pro Trial
                  </button>
                </Link>
              </div>

              {/* Enterprise Plan */}
              <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Enterprise</h3>
                  <div className="text-4xl font-bold text-gray-900 mb-4">
                    $99<span className="text-lg font-normal text-gray-600">/month</span>
                  </div>
                  <p className="text-gray-600 mb-6">For large organizations and teams</p>
                </div>
                
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-3">✓</span>
                    Everything in Pro
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-3">✓</span>
                    Team collaboration
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-3">✓</span>
                    API access
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-3">✓</span>
                    SSO integration
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-3">✓</span>
                    Dedicated support
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-3">✓</span>
                    Custom integrations
                  </li>
                </ul>
                
                <Link href="/contact">
                  <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                    Contact Sales
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Frequently Asked Questions
            </h2>
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Can I upgrade or downgrade my plan anytime?
                </h3>
                <p className="text-gray-600">
                  Yes, you can change your plan at any time. Changes take effect immediately, and we&apos;ll prorate any billing differences.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Is there a free trial for paid plans?
                </h3>
                <p className="text-gray-600">
                  Yes, we offer a 14-day free trial for both Pro and Enterprise plans. No credit card required to start.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Are the NDAs legally binding?
                </h3>
                <p className="text-gray-600">
                  Yes, our templates are created by legal professionals and are legally binding when properly executed by all parties.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-8 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-gray-400">
              © 2025 CONFIDO. All rights reserved. | 
              <Link href="/about" className="hover:text-white ml-2">About</Link> | 
              <Link href="/contact" className="hover:text-white ml-2">Contact</Link>
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
