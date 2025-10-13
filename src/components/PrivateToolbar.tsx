'use client'

import Link from 'next/link'
import { useAuth, UserButton } from '@clerk/nextjs'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

export default function PrivateToolbar() {
  const { userId } = useAuth()
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  if (!userId) return null

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', current: pathname === '/dashboard' },
    { name: 'Create NDA', href: '/fillnda', current: pathname === '/fillnda' },
    { name: 'My NDAs', href: '/mynda', current: pathname === '/mynda' },
    { name: 'My Drafts', href: '/mydrafts', current: pathname === '/mydrafts' },
    { name: 'Company Details', href: '/companydetails', current: pathname === '/companydetails' },
    { name: 'Settings', href: '/settings', current: pathname === '/settings' },
  ]

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="flex-shrink-0">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
                <span className="ml-2 text-xl font-semibold text-gray-900">Agreedo</span>
              </div>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:ml-8 lg:flex lg:space-x-8">
              {navigation.slice(0, 4).map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    item.current
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              
              {/* More Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
                >
                  More
                  <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {isMenuOpen && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                    {navigation.slice(4).map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`block px-4 py-2 text-sm ${
                          item.current
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                    ))}
                    <Link
                      href="/about"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      About
                    </Link>
                    <Link
                      href="/contact"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Contact
                    </Link>
                    <Link
                      href="/plans"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Plans
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link
              href="/fillnda"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New NDA
            </Link>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="lg:hidden">
        <div className="pt-2 pb-3 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                item.current
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {item.name}
            </Link>
          ))}
          <Link
            href="/about"
            className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 text-base font-medium"
          >
            About
          </Link>
          <Link
            href="/contact"
            className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 text-base font-medium"
          >
            Contact
          </Link>
          <Link
            href="/plans"
            className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 text-base font-medium"
          >
            Plans
          </Link>
        </div>
      </div>
    </nav>
  )
}
