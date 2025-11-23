'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Check } from 'lucide-react'

export default function Plans() {
  const [mounted, setMounted] = useState(false)
  const plansRef = useRef<HTMLDivElement>(null)
  const faqRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in-element')
        }
      })
    }, observerOptions)

    if (plansRef.current) observer.observe(plansRef.current)
    if (faqRef.current) observer.observe(faqRef.current)

    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }

        .animate-fade-in {
          animation: fadeIn 1s ease-out forwards;
        }

        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }

        .fade-in-element {
          animation: fadeInUp 0.8s ease-out forwards;
        }

        .opacity-0 {
          opacity: 0;
        }

        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }

        .bg-grid-pattern {
          background-image: 
            linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px);
          background-size: 50px 50px;
        }
      `}</style>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden">
        {/* Grid Pattern Background */}
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          {mounted && (
            <>
              <h1 className="text-5xl sm:text-6xl font-bold mb-6 animate-fade-in-up">
                Choose Your Plan
              </h1>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto animate-fade-in-up delay-100">
                Start free, upgrade when you need more. All plans include secure e-signatures.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Plans Grid */}
      <div className="py-20 bg-gray-50">
        <div ref={plansRef} className="opacity-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
            {/* Free Plan */}
            <div className="bg-white rounded-xl border border-gray-200 p-8 hover:border-teal-600 transition-all duration-300 hover:shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
              
              <div className="mb-8">
                <span className="text-5xl font-bold text-gray-900">$0</span>
                <span className="text-gray-500 text-lg">/month</span>
              </div>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3 text-gray-700">
                  <Check className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                  <span>Up to <strong>3 NDAs</strong></span>
                </li>
                <li className="flex items-start gap-3 text-gray-700">
                  <Check className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                  <span>Basic templates</span>
                </li>
                <li className="flex items-start gap-3 text-gray-700">
                  <Check className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                  <span>E-signature support</span>
                </li>
                <li className="flex items-start gap-3 text-gray-700">
                  <Check className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                  <span>Email support</span>
                </li>
              </ul>
              
              <Link 
                href="/dashboard"
                className="block w-full text-center border border-gray-900 text-gray-900 py-3 px-4 rounded-lg font-semibold hover:bg-gray-900 hover:text-white transition-all duration-200"
              >
                Get Started
              </Link>
            </div>

            {/* Pro Plan - Featured */}
            <div className="relative bg-slate-900 rounded-xl p-8 shadow-xl transform lg:scale-105 z-10">
              {/* Popular Badge */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-teal-600 text-white px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide">
                  Popular
                </div>
              </div>

              <h3 className="text-2xl font-bold text-white mb-2 mt-2">Pro</h3>
              
              <div className="mb-8">
                <span className="text-5xl font-bold text-white">$19.99</span>
                <span className="text-gray-400 text-lg">/month</span>
              </div>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3 text-gray-300">
                  <Check className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
                  <span><strong className="text-white">Unlimited NDAs</strong></span>
                </li>
                <li className="flex items-start gap-3 text-gray-300">
                  <Check className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
                  <span>All templates</span>
                </li>
                <li className="flex items-start gap-3 text-gray-300">
                  <Check className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
                  <span>E-signature support</span>
                </li>
                <li className="flex items-start gap-3 text-gray-300">
                  <Check className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-start gap-3 text-gray-300">
                  <Check className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
                  <span>Advanced tracking</span>
                </li>
                <li className="flex items-start gap-3 text-gray-300">
                  <Check className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
                  <span>Custom branding</span>
                </li>
              </ul>
              
              <button className="w-full bg-teal-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-teal-700 transition-all duration-200">
                Upgrade to Pro
              </button>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white rounded-xl border border-gray-200 p-8 hover:border-teal-600 transition-all duration-300 hover:shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Enterprise</h3>
              
              <div className="mb-8">
                <span className="text-5xl font-bold text-gray-900">Custom</span>
              </div>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3 text-gray-700">
                  <Check className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Unlimited everything</strong></span>
                </li>
                <li className="flex items-start gap-3 text-gray-700">
                  <Check className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                  <span>Custom templates</span>
                </li>
                <li className="flex items-start gap-3 text-gray-700">
                  <Check className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                  <span>Dedicated support</span>
                </li>
                <li className="flex items-start gap-3 text-gray-700">
                  <Check className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                  <span>API access</span>
                </li>
                <li className="flex items-start gap-3 text-gray-700">
                  <Check className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                  <span>Account manager</span>
                </li>
                <li className="flex items-start gap-3 text-gray-700">
                  <Check className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                  <span>Custom integrations</span>
                </li>
              </ul>
              
              <Link
                href="/contact"
                className="block w-full text-center border border-gray-900 text-gray-900 py-3 px-4 rounded-lg font-semibold hover:bg-gray-900 hover:text-white transition-all duration-200"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Comparison */}
      <div ref={faqRef} className="opacity-0 py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              All Plans Include
            </h2>
            <p className="text-gray-600">
              Core features available in every plan
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center mb-3 mx-auto">
                <Check className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm">Secure Storage</h3>
            </div>

            <div className="text-center">
              <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center mb-3 mx-auto">
                <Check className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm">E-Signatures</h3>
            </div>

            <div className="text-center">
              <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center mb-3 mx-auto">
                <Check className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm">Status Tracking</h3>
            </div>

            <div className="text-center">
              <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center mb-3 mx-auto">
                <Check className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm">Mobile Access</h3>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Still have questions?
          </h2>
          <p className="text-lg text-gray-300 mb-8">
            Our team is here to help you choose the right plan for your needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-all duration-200"
            >
              Contact Sales
            </Link>
            <Link
              href="/about"
              className="px-6 py-3 bg-white/10 border border-white/30 text-white font-semibold rounded-lg hover:bg-white/20 transition-all duration-200"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
