'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useAuth, UserButton } from '@clerk/nextjs'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'

export default function PrivateToolbar() {
  const { userId } = useAuth()
  const pathname = usePathname()
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false)
  const [isDevMenuOpen, setIsDevMenuOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const moreMenuRef = useRef<HTMLDivElement>(null)
  const devMenuRef = useRef<HTMLDivElement>(null)
  const moreMenuRefTablet = useRef<HTMLDivElement>(null)
  const devMenuRefTablet = useRef<HTMLDivElement>(null)

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', current: pathname === '/dashboard' },
    { name: 'Fill NDA', href: '/templates', current: pathname === '/fillnda' || pathname === '/templates' },
    { name: 'My NDAs', href: '/mynda', current: pathname === '/mynda' },
    { name: 'My Drafts', href: '/mydrafts', current: pathname === '/mydrafts' },
    { name: 'Company Details', href: '/companydetails', current: pathname === '/companydetails' },
    { name: 'Settings', href: '/settings', current: pathname === '/settings' },
  ]

  const additionalLinks = [
    { name: 'Fill HTML NDA', href: '/fillndahtml' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
    { name: 'Plans', href: '/plans' },
  ]

  const devLinks = [
    { name: '🔧 Fill NDA (Classic)', href: '/fillnda' },
    { name: '🎨 Fill NDA (HTML)', href: '/fillndahtml' },
    { name: '🎨 Fill NDA (Design)', href: '/fillndahtml?templateId=design_mutual_nda_v1' },
    { name: '✨ Fill NDA (Professional)', href: '/fillndahtml?templateId=professional_mutual_nda_v1' },
    { name: '👁️ Live Preview (Design)', href: '/preview-template?template=design_mutual_nda_v1' },
    { name: '�️ Live Preview (Pro)', href: '/preview-template?template=professional_mutual_nda_v1' },
    { name: '�📝 Review & Sign', href: '/review-nda/test-token-123' },
    { name: '💡 Review Suggestions', href: '/review-suggestions' },
    { name: '📋 Templates', href: '/templates' },
    { name: '📄 Templates Viewer', href: '/devtemplates' },
  ]

  const isDev = process.env.NODE_ENV === 'development'

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (
        moreMenuRef.current && !moreMenuRef.current.contains(target) &&
        moreMenuRefTablet.current && !moreMenuRefTablet.current.contains(target)
      ) {
        setIsMoreMenuOpen(false)
      }
      if (
        devMenuRef.current && !devMenuRef.current.contains(target) &&
        devMenuRefTablet.current && !devMenuRefTablet.current.contains(target)
      ) {
        setIsDevMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!userId) return null

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="flex-shrink-0">
              <div className="flex items-center">
                <Image 
                  src="/agreedo-logo.png" 
                  alt="Agreedo" 
                  width={200} 
                  height={50}
                  className="h-30 w-auto"
                  priority
                />
              </div>
            </Link>
            
            {/* Desktop Navigation - Show first 3 items */}
            <div className="hidden xl:ml-8 xl:flex xl:space-x-4">
              {navigation.slice(0, 3).map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`inline-flex items-center px-3 py-1 border-b-2 text-sm font-medium transition-colors ${
                    item.current
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              
              {/* More Dropdown for desktop */}
              <div className="relative" ref={moreMenuRef}>
                <button
                  onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                  className={`inline-flex items-center px-3 py-1 border-b-2 text-sm font-medium transition-colors ${
                    isMoreMenuOpen ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  More
                  <svg className={`ml-1 h-4 w-4 transition-transform ${isMoreMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {isMoreMenuOpen && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
                    <div className="py-1">
                      {navigation.slice(3).map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={`block px-4 py-2.5 text-sm font-medium transition-colors ${
                            item.current
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                          onClick={() => setIsMoreMenuOpen(false)}
                        >
                          {item.name}
                        </Link>
                      ))}
                      <div className="border-t border-gray-200 my-1"></div>
                      {additionalLinks.map((link) => (
                        <Link
                          key={link.name}
                          href={link.href}
                          className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setIsMoreMenuOpen(false)}
                        >
                          {link.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Dev Dropdown for desktop */}
              {isDev && (
                <div className="relative" ref={devMenuRef}>
                  <button
                    onClick={() => setIsDevMenuOpen(!isDevMenuOpen)}
                    className={`inline-flex items-center px-3 py-1 border-b-2 text-sm font-medium transition-colors ${
                      isDevMenuOpen ? 'border-purple-500 text-purple-700' : 'border-transparent text-purple-600 hover:border-purple-300 hover:text-purple-700'
                    }`}
                  >
                    🔧 Dev
                    <svg className={`ml-1 h-4 w-4 transition-transform ${isDevMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {isDevMenuOpen && (
                    <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-purple-200 rounded-lg shadow-xl z-50 overflow-hidden">
                      <div className="py-1 bg-purple-50">
                        <div className="px-4 py-2 text-xs font-semibold text-purple-600 uppercase tracking-wide">
                          Development Tools
                        </div>
                      </div>
                      <div className="py-1">
                        {devLinks.map((link) => (
                          <Link
                            key={link.name}
                            href={link.href}
                            className="block px-4 py-2.5 text-sm font-medium text-purple-700 hover:bg-purple-50 transition-colors"
                            onClick={() => setIsDevMenuOpen(false)}
                          >
                            {link.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tablet/Small Desktop - Show first 2 items */}
            <div className="hidden lg:ml-8 lg:flex lg:space-x-4 xl:hidden">
              {navigation.slice(0, 2).map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`inline-flex items-center px-3 py-1 border-b-2 text-sm font-medium transition-colors ${
                    item.current
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              
              {/* More Dropdown for tablet */}
              <div className="relative" ref={moreMenuRefTablet}>
                <button
                  onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                  className={`inline-flex items-center px-3 py-1 border-b-2 text-sm font-medium transition-colors ${
                    isMoreMenuOpen ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  More
                  <svg className={`ml-1 h-4 w-4 transition-transform ${isMoreMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {isMoreMenuOpen && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
                    <div className="py-1">
                      {navigation.slice(2).map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={`block px-4 py-2.5 text-sm font-medium transition-colors ${
                            item.current
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                          onClick={() => setIsMoreMenuOpen(false)}
                        >
                          {item.name}
                        </Link>
                      ))}
                      <div className="border-t border-gray-200 my-1"></div>
                      {additionalLinks.map((link) => (
                        <Link
                          key={link.name}
                          href={link.href}
                          className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setIsMoreMenuOpen(false)}
                        >
                          {link.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Dev Dropdown for tablet */}
              {isDev && (
                <div className="relative" ref={devMenuRefTablet}>
                  <button
                    onClick={() => setIsDevMenuOpen(!isDevMenuOpen)}
                    className={`inline-flex items-center px-3 py-1 border-b-2 text-sm font-medium transition-colors ${
                      isDevMenuOpen ? 'border-purple-500 text-purple-700' : 'border-transparent text-purple-600 hover:border-purple-300 hover:text-purple-700'
                    }`}
                  >
                    🔧 Dev
                    <svg className={`ml-1 h-4 w-4 transition-transform ${isDevMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {isDevMenuOpen && (
                    <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-purple-200 rounded-lg shadow-xl z-50 overflow-hidden">
                      <div className="py-1 bg-purple-50">
                        <div className="px-4 py-2 text-xs font-semibold text-purple-600 uppercase tracking-wide">
                          Development Tools
                        </div>
                      </div>
                      <div className="py-1">
                        {devLinks.map((link) => (
                          <Link
                            key={link.name}
                            href={link.href}
                            className="block px-4 py-2.5 text-sm font-medium text-purple-700 hover:bg-purple-50 transition-colors"
                            onClick={() => setIsDevMenuOpen(false)}
                          >
                            {link.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Right side buttons - Desktop */}
          <div className="hidden lg:flex items-center space-x-4">
            <Link
              href="/templates"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-sm hover:shadow-md"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New NDA
            </Link>
            <UserButton afterSignOutUrl="/" />
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {!isMobileMenuOpen ? (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white shadow-lg">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  item.current
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="border-t border-gray-200 my-2"></div>
            {additionalLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            {isDev && (
              <>
                <div className="border-t border-gray-200 my-2"></div>
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 rounded-md">
                  🔧 Dev Tools
                </div>
                {devLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="block px-3 py-2 rounded-md text-base font-medium text-purple-700 hover:text-purple-900 hover:bg-purple-50 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.name}
                  </Link>
                ))}
              </>
            )}
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center px-4 mb-3">
              <UserButton afterSignOutUrl="/" />
              <span className="ml-3 text-sm text-gray-500">Your Account</span>
            </div>
            <div className="px-2">
              <Link
                href="/templates"
                className="w-full flex items-center justify-center px-4 py-2.5 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all shadow-sm"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                New NDA
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
