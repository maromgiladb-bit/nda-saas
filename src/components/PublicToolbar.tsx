'use client'

import Link from 'next/link'
import { useAuth, SignInButton } from '@clerk/nextjs'

export default function PublicToolbar() {
  const { userId } = useAuth()

  // Don't show public toolbar if user is signed in
  if (userId) return null

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
                <span className="ml-2 text-xl font-semibold text-gray-900">Agreedo</span>
              </div>
            </Link>
            
            <div className="hidden md:ml-8 md:flex md:space-x-8">
              <Link href="/" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 text-sm font-medium">
                Home
              </Link>
              <Link href="/about" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 text-sm font-medium">
                About
              </Link>
              <Link href="/plans" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 text-sm font-medium">
                Plans
              </Link>
              <Link href="/contact" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 text-sm font-medium">
                Contact
              </Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <SignInButton mode="modal">
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                Sign In
              </button>
            </SignInButton>
            <SignInButton mode="modal">
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                Get Started
              </button>
            </SignInButton>
          </div>
        </div>
      </div>
    </nav>
  )
}
