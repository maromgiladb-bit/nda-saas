'use client'

import { SignIn, useAuth } from '@clerk/nextjs'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SignInPage() {
  const { isLoaded, userId } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && userId) {
      // User is already signed in, redirect to dashboard
      router.push('/dashboard')
    }
  }, [isLoaded, userId, router])

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to Agreedo
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Access your NDA drafts and manage agreements
          </p>
        </div>
        <div className="bg-white py-8 px-6 shadow rounded-lg">
          <SignIn 
            routing="hash"
            redirectUrl="/"
            appearance={{
              elements: {
                footerAction: { display: 'none' },
                card: { boxShadow: 'none' }
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}