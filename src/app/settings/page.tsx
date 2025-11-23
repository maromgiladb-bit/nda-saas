'use client'

import { useAuth, useUser } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface SubscriptionInfo {
  plan: 'FREE' | 'PRO' | 'ENTERPRISE' | 'DEVELOPER'
  ndaCount: number
  limit: number | null
  remaining: number | null
}

export default function SettingsPage() {
  const { userId } = useAuth()
  const { user } = useUser()
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const response = await fetch('/api/user/check-limit')
        if (response.ok) {
          const data = await response.json()
          setSubscription(data)
        }
      } catch (error) {
        console.error('Failed to fetch subscription:', error)
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchSubscription()
    }
  }, [userId])

  if (!userId) {
    redirect('/sign-in')
  }

  const getPlanDisplayName = (plan: string) => {
    switch (plan) {
      case 'FREE': return 'Free'
      case 'PRO': return 'Pro'
      case 'ENTERPRISE': return 'Enterprise'
      case 'DEVELOPER': return 'Developer'
      default: return plan
    }
  }

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'FREE': return 'bg-gray-100 text-gray-800'
      case 'PRO': return 'bg-teal-100 text-teal-800'
      case 'ENTERPRISE': return 'bg-slate-100 text-slate-800'
      case 'DEVELOPER': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPlanPrice = (plan: string) => {
    switch (plan) {
      case 'FREE': return '$0/month'
      case 'PRO': return '$19.99/month'
      case 'ENTERPRISE': return 'Custom pricing'
      case 'DEVELOPER': return 'Complimentary'
      default: return 'N/A'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
          <div className="flex items-center gap-4 mb-4 animate-fade-in">
            <div className="w-16 h-16 bg-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-5xl font-bold mb-2">Settings</h1>
              <p className="text-xl text-gray-200">Manage your account and preferences</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Subscription & Billing */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-teal-50 to-blue-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Subscription & Billing</h2>
                </div>
                {subscription && subscription.plan === 'FREE' && (
                  <Link 
                    href="/plans"
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-all shadow-sm hover:shadow-md"
                  >
                    Upgrade Plan →
                  </Link>
                )}
              </div>
            </div>
            <div className="p-8">
              {loading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ) : subscription ? (
                <div className="space-y-6">
                  {/* Current Plan */}
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-600 mb-3">Current Plan</label>
                    <div className="flex items-center gap-3">
                      <span className={`px-4 py-2 rounded-xl text-sm font-bold ${getPlanColor(subscription.plan)} shadow-sm`}>
                        {getPlanDisplayName(subscription.plan)}
                      </span>
                      {subscription.plan === 'DEVELOPER' && (
                        <span className="text-sm text-gray-500 italic">✨ Full access</span>
                      )}
                    </div>
                  </div>

                  {/* Usage */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-3">Usage</label>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-gray-700 font-medium">NDAs Created</span>
                        <span className="text-2xl font-bold text-gray-900">
                          {subscription.ndaCount} {subscription.limit ? `/ ${subscription.limit}` : ''}
                        </span>
                      </div>
                    
                      {subscription.plan === 'FREE' && subscription.limit && (
                        <>
                          <div className="w-full bg-gray-200 rounded-full h-3 mb-3 overflow-hidden">
                            <div 
                              className={`h-3 rounded-full transition-all duration-500 ${
                                subscription.remaining === 0 ? 'bg-gradient-to-r from-red-500 to-red-600' : 
                                subscription.remaining === 1 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 
                                'bg-gradient-to-r from-teal-500 to-blue-500'
                              }`}
                              style={{ width: `${(subscription.ndaCount / subscription.limit) * 100}%` }}
                            />
                          </div>
                          <p className="text-sm">
                            {subscription.remaining === 0 ? (
                              <span className="text-red-600 font-semibold flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                Limit reached. Upgrade to create more NDAs.
                              </span>
                            ) : subscription.remaining === 1 ? (
                              <span className="text-yellow-600 font-semibold flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                {subscription.remaining} NDA remaining
                              </span>
                            ) : (
                              <span className="text-gray-700">
                                {subscription.remaining} NDAs remaining on free plan
                              </span>
                            )}
                          </p>
                        </>
                      )}

                      {(subscription.plan === 'PRO' || subscription.plan === 'ENTERPRISE' || subscription.plan === 'DEVELOPER') && (
                        <p className="text-sm text-gray-700 flex items-center gap-2 font-medium">
                          <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Unlimited NDAs
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Billing Information */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-3">Billing Information</label>
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200 shadow-sm space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-medium">Price</span>
                        <span className="text-gray-900 font-bold text-lg">{getPlanPrice(subscription.plan)}</span>
                      </div>
                      <div className="h-px bg-gray-200"></div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-medium">Billing Cycle</span>
                        <span className="text-gray-900">
                          {subscription.plan === 'FREE' || subscription.plan === 'DEVELOPER' ? 'N/A' : 'Monthly'}
                        </span>
                      </div>
                      <div className="h-px bg-gray-200"></div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-medium">Next Billing Date</span>
                        <span className="text-gray-900">
                          {subscription.plan === 'FREE' || subscription.plan === 'DEVELOPER' ? 'N/A' : 
                            new Date(new Date().setMonth(new Date().getMonth() + 1)).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="h-px bg-gray-200"></div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-medium">Payment Method</span>
                        <span className="text-gray-900">
                          {subscription.plan === 'FREE' || subscription.plan === 'DEVELOPER' ? 'N/A' : '•••• •••• •••• 4242'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Plan Actions */}
                  {subscription.plan === 'FREE' && (
                    <div className="pt-4">
                      <Link
                        href="/plans"
                        className="block w-full text-center bg-gradient-to-r from-teal-600 to-blue-600 text-white py-4 px-4 rounded-xl font-bold hover:from-teal-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg hover:scale-105 duration-300"
                      >
                        Upgrade to Pro - $19.99/month
                      </Link>
                    </div>
                  )}

                  {subscription.plan === 'PRO' && (
                    <div className="pt-4 flex gap-3">
                      <button className="flex-1 border-2 border-gray-300 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all">
                        Update Payment Method
                      </button>
                      <button className="flex-1 border-2 border-red-300 text-red-700 py-3 px-4 rounded-xl font-semibold hover:bg-red-50 hover:border-red-400 transition-all">
                        Cancel Subscription
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-600">Unable to load subscription information</p>
              )}
            </div>
          </div>
        </div>

        {/* Account Information */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Account Information</h2>
              </div>
            </div>
            <div className="p-8 space-y-6">
              <div className="group">
                <label className="block text-sm font-semibold text-gray-600 mb-2">Full Name</label>
                <p className="text-lg text-gray-900 font-medium">{user?.fullName || 'Not set'}</p>
              </div>
              <div className="h-px bg-gray-200"></div>
              <div className="group">
                <label className="block text-sm font-semibold text-gray-600 mb-2">Email Address</label>
                <p className="text-lg text-gray-900 font-medium">{user?.primaryEmailAddress?.emailAddress || 'Not set'}</p>
              </div>
              <div className="h-px bg-gray-200"></div>
              <div className="group">
                <label className="block text-sm font-semibold text-gray-600 mb-2">User ID</label>
                <p className="text-sm text-gray-900 font-mono bg-gray-100 px-3 py-2 rounded-lg inline-block">{userId}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div>
          <div className="bg-white rounded-2xl shadow-sm border-2 border-red-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6 border-b-2 border-red-200 bg-gradient-to-r from-red-50 to-red-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-red-900">Danger Zone</h2>
              </div>
            </div>
            <div className="p-8">
              <p className="text-gray-700 mb-6 text-lg">Once you delete your account, there is no going back. Please be certain.</p>
              <button className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-bold shadow-md hover:shadow-lg">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .bg-grid-pattern {
          background-image: 
            linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px);
          background-size: 40px 40px;
        }

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

        .animate-fade-in {
          animation: fadeInUp 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
