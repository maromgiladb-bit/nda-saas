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
      case 'PRO': return 'bg-blue-100 text-blue-800'
      case 'ENTERPRISE': return 'bg-purple-100 text-purple-800'
      case 'DEVELOPER': return 'bg-green-100 text-green-800'
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          </div>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>

        {/* Subscription & Billing */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 mb-6">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Subscription & Billing</h2>
              {subscription && subscription.plan === 'FREE' && (
                <Link 
                  href="/plans"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Upgrade Plan →
                </Link>
              )}
            </div>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ) : subscription ? (
              <div className="space-y-6">
                {/* Current Plan */}
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">Current Plan</label>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getPlanColor(subscription.plan)}`}>
                      {getPlanDisplayName(subscription.plan)}
                    </span>
                    {subscription.plan === 'DEVELOPER' && (
                      <span className="text-xs text-gray-500 italic">Full access</span>
                    )}
                  </div>
                </div>

                {/* Usage */}
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">Usage</label>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-700 font-medium">NDAs Created</span>
                      <span className="text-gray-900 font-bold">
                        {subscription.ndaCount} {subscription.limit ? `/ ${subscription.limit}` : ''}
                      </span>
                    </div>
                    
                    {subscription.plan === 'FREE' && subscription.limit && (
                      <>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${
                              subscription.remaining === 0 ? 'bg-red-500' : 
                              subscription.remaining === 1 ? 'bg-yellow-500' : 
                              'bg-blue-500'
                            }`}
                            style={{ width: `${(subscription.ndaCount / subscription.limit) * 100}%` }}
                          />
                        </div>
                        <p className="text-sm text-gray-600">
                          {subscription.remaining === 0 ? (
                            <span className="text-red-600 font-semibold">
                              ⚠️ Limit reached. Upgrade to create more NDAs.
                            </span>
                          ) : subscription.remaining === 1 ? (
                            <span className="text-yellow-600 font-semibold">
                              ⚠️ {subscription.remaining} NDA remaining
                            </span>
                          ) : (
                            <span>
                              {subscription.remaining} NDAs remaining on free plan
                            </span>
                          )}
                        </p>
                      </>
                    )}

                    {(subscription.plan === 'PRO' || subscription.plan === 'ENTERPRISE' || subscription.plan === 'DEVELOPER') && (
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Unlimited NDAs
                      </p>
                    )}
                  </div>
                </div>

                {/* Billing Information */}
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">Billing Information</label>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Price</span>
                      <span className="text-gray-900 font-semibold">{getPlanPrice(subscription.plan)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Billing Cycle</span>
                      <span className="text-gray-900">
                        {subscription.plan === 'FREE' || subscription.plan === 'DEVELOPER' ? 'N/A' : 'Monthly'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Next Billing Date</span>
                      <span className="text-gray-900">
                        {subscription.plan === 'FREE' || subscription.plan === 'DEVELOPER' ? 'N/A' : 
                          new Date(new Date().setMonth(new Date().getMonth() + 1)).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Payment Method</span>
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
                      className="block w-full text-center bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      Upgrade to Pro - $19.99/month
                    </Link>
                  </div>
                )}

                {subscription.plan === 'PRO' && (
                  <div className="pt-4 flex gap-3">
                    <button className="flex-1 border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                      Update Payment Method
                    </button>
                    <button className="flex-1 border border-red-300 text-red-700 py-2.5 px-4 rounded-lg font-medium hover:bg-red-50 transition-colors">
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

        {/* Account Information */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 mb-6">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Account Information</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Full Name</label>
              <p className="text-gray-900">{user?.fullName || 'Not set'}</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Email Address</label>
              <p className="text-gray-900">{user?.primaryEmailAddress?.emailAddress || 'Not set'}</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">User ID</label>
              <p className="text-gray-900 font-mono text-sm">{userId}</p>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 mb-6">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Preferences</h2>
          </div>
          <div className="p-6">
            <p className="text-gray-600">More preference options coming soon...</p>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-2xl shadow-md border border-red-200">
          <div className="p-6 border-b border-red-200 bg-red-50">
            <h2 className="text-xl font-bold text-red-900">Danger Zone</h2>
          </div>
          <div className="p-6">
            <p className="text-gray-600 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
