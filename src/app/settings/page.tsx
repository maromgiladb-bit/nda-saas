'use client'

import { useAuth, useUser } from '@clerk/nextjs'
import { redirect } from 'next/navigation'

export default function SettingsPage() {
  const { userId } = useAuth()
  const { user } = useUser()

  if (!userId) {
    redirect('/sign-in')
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
