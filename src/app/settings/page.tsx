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
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Account Information</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Personal details and account management
        </p>
      </div>

      <div className="px-4 py-5 sm:p-6 space-y-6">
        <div className="group">
          <label className="block text-sm font-semibold text-gray-600 mb-2">Full Name</label>
          <p className="text-lg text-gray-900 font-medium">{user?.fullName || 'Not set'}</p>
        </div>
        <div className="h-px bg-gray-100"></div>
        <div className="group">
          <label className="block text-sm font-semibold text-gray-600 mb-2">Email Address</label>
          <p className="text-lg text-gray-900 font-medium">{user?.primaryEmailAddress?.emailAddress || 'Not set'}</p>
        </div>
        <div className="h-px bg-gray-100"></div>
        <div className="group">
          <label className="block text-sm font-semibold text-gray-600 mb-2">User ID</label>
          <p className="text-sm text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded-lg inline-block border border-gray-200">{userId}</p>
        </div>
      </div>

      {/* Preferences */}
      <div className="mt-8 px-4 py-5 sm:px-6 border-t border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Preferences</h3>
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">Show Organization Switcher</span>
                <span className="text-sm text-gray-500">Display the organization dropdown in the toolbar</span>
              </span>
            </div>
            <button
              type="button"
              disabled
              className="bg-gray-200 relative inline-flex h-6 w-11 flex-shrink-0 cursor-not-allowed rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2"
              role="switch"
              aria-checked="false"
            >
              <span aria-hidden="true" className="translate-x-0 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
            </button>
          </div>
          <p className="text-xs text-gray-400 italic">* This setting is managed by your organization administrator (Coming Soon)</p>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="mt-8 px-4 py-5 sm:px-6 border-t border-gray-200 bg-red-50 sm:rounded-b-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 rounded-lg">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-red-800">Danger Zone</h3>
        </div>
        <p className="text-sm text-red-600 mb-4">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <button className="px-4 py-2 bg-white border border-red-300 text-red-700 rounded-md hover:bg-red-50 font-medium transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
          Delete Account
        </button>
      </div>
    </div>
  )
}
