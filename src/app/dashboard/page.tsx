'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Draft {
  id: string
  title: string
  status: string
  created_at: string
  updated_at: string
  data?: {
    party_a?: {
      name?: string
      company_name?: string
    }
    party_b?: {
      name?: string
      company_name?: string
    }
    [key: string]: unknown
  }
  signers?: { id: string; email: string; role: string; status: string }[]
}

type FilterStatus = 'ALL' | 'DRAFT' | 'SENT' | 'SIGNED' | 'VOID' | 'WAITING_REVIEW'

export default function Dashboard() {
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchDrafts()
  }, [])

  const fetchDrafts = async () => {
    try {
      const response = await fetch('/api/ndas/drafts')
      const data = await response.json()
      if (data.drafts) {
        setDrafts(data.drafts)
      }
    } catch (error) {
      console.error('Error fetching drafts:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800'
      case 'SENT': return 'bg-blue-100 text-blue-800'
      case 'SIGNED': return 'bg-green-100 text-green-800'
      case 'VOID': return 'bg-red-100 text-red-800'
      case 'WAITING_REVIEW': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getFilteredDrafts = () => {
    let filtered = drafts
    
    // Filter by status
    if (filterStatus !== 'ALL') {
      filtered = filtered.filter(d => d.status.toUpperCase() === filterStatus)
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(draft => {
        // Search in title
        if (draft.title?.toLowerCase().includes(query)) return true
        
        // Search in receiving party name (party_b)
        if (draft.data?.party_b?.name?.toLowerCase().includes(query)) return true
        if (draft.data?.party_b?.company_name?.toLowerCase().includes(query)) return true
        
        // Search in sending party name (party_a) 
        if (draft.data?.party_a?.name?.toLowerCase().includes(query)) return true
        if (draft.data?.party_a?.company_name?.toLowerCase().includes(query)) return true
        
        // Search in date
        const createdDate = new Date(draft.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        const updatedDate = new Date(draft.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        if (createdDate.toLowerCase().includes(query) || updatedDate.toLowerCase().includes(query)) return true
        
        return false
      })
    }
    
    return filtered
  }

  const filteredDrafts = getFilteredDrafts()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-gray-200 rounded-xl w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded-2xl"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-1">Manage your NDAs and track signatures</p>
              </div>
            </div>
            {/* Removed Create New NDA button as requested */}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`bg-white p-6 rounded-xl shadow-md border transition-all text-left ${
              filterStatus === 'ALL' 
                ? 'border-blue-500 ring-2 ring-blue-200 shadow-lg' 
                : 'border-gray-100 hover:shadow-lg hover:border-blue-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total NDAs</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{drafts.length}</p>
              </div>
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all ${
                filterStatus === 'ALL' 
                  ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-md' 
                  : 'bg-gradient-to-br from-blue-100 to-blue-200'
              }`}>
                <svg className={`h-6 w-6 ${filterStatus === 'ALL' ? 'text-white' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </button>
          
          <button
            onClick={() => setFilterStatus('DRAFT')}
            className={`bg-white p-6 rounded-xl shadow-md border transition-all text-left ${
              filterStatus === 'DRAFT' 
                ? 'border-gray-500 ring-2 ring-gray-200 shadow-lg' 
                : 'border-gray-100 hover:shadow-lg hover:border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Draft</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {drafts.filter(d => d.status === 'DRAFT').length}
                </p>
              </div>
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all ${
                filterStatus === 'DRAFT' 
                  ? 'bg-gradient-to-br from-gray-500 to-gray-600 shadow-md' 
                  : 'bg-gradient-to-br from-gray-100 to-gray-200'
              }`}>
                <svg className={`h-6 w-6 ${filterStatus === 'DRAFT' ? 'text-white' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
            </div>
          </button>

          <button
            onClick={() => setFilterStatus('WAITING_REVIEW')}
            className={`bg-white p-6 rounded-xl shadow-md border transition-all text-left ${
              filterStatus === 'WAITING_REVIEW' 
                ? 'border-yellow-500 ring-2 ring-yellow-200 shadow-lg' 
                : 'border-gray-100 hover:shadow-lg hover:border-yellow-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Waiting Review</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {drafts.filter(d => d.status === 'WAITING_REVIEW').length}
                </p>
              </div>
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all ${
                filterStatus === 'WAITING_REVIEW' 
                  ? 'bg-gradient-to-br from-yellow-500 to-yellow-600 shadow-md' 
                  : 'bg-gradient-to-br from-yellow-100 to-yellow-200'
              }`}>
                <svg className={`h-6 w-6 ${filterStatus === 'WAITING_REVIEW' ? 'text-white' : 'text-yellow-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
            </div>
          </button>

          <button
            onClick={() => setFilterStatus('SENT')}
            className={`bg-white p-6 rounded-xl shadow-md border transition-all text-left ${
              filterStatus === 'SENT' 
                ? 'border-purple-500 ring-2 ring-purple-200 shadow-lg' 
                : 'border-gray-100 hover:shadow-lg hover:border-purple-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Sent</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {drafts.filter(d => d.status === 'SENT').length}
                </p>
              </div>
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all ${
                filterStatus === 'SENT' 
                  ? 'bg-gradient-to-br from-purple-500 to-purple-600 shadow-md' 
                  : 'bg-gradient-to-br from-purple-100 to-purple-200'
              }`}>
                <svg className={`h-6 w-6 ${filterStatus === 'SENT' ? 'text-white' : 'text-purple-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
            </div>
          </button>

          <button
            onClick={() => setFilterStatus('SIGNED')}
            className={`bg-white p-6 rounded-xl shadow-md border transition-all text-left ${
              filterStatus === 'SIGNED' 
                ? 'border-green-500 ring-2 ring-green-200 shadow-lg' 
                : 'border-gray-100 hover:shadow-lg hover:border-green-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Signed</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {drafts.filter(d => d.status === 'SIGNED').length}
                </p>
              </div>
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all ${
                filterStatus === 'SIGNED' 
                  ? 'bg-gradient-to-br from-green-500 to-green-600 shadow-md' 
                  : 'bg-gradient-to-br from-green-100 to-green-200'
              }`}>
                <svg className={`h-6 w-6 ${filterStatus === 'SIGNED' ? 'text-white' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </button>
        </div>

        {/* NDAs List */}
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
          <div className="bg-white border-b border-gray-200 px-8 py-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                {filterStatus === 'DRAFT' ? (
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                ) : filterStatus === 'SENT' ? (
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </div>
                ) : filterStatus === 'SIGNED' ? (
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {filterStatus === 'ALL' ? 'Your NDAs' : `${filterStatus.charAt(0) + filterStatus.slice(1).toLowerCase()} NDAs`}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {filterStatus === 'ALL' 
                      ? 'in order of most recently created and updated NDAs first' 
                      : `Showing ${filteredDrafts.length} ${filterStatus.toLowerCase()} ${filteredDrafts.length === 1 ? 'NDA' : 'NDAs'}`}
                  </p>
                </div>
              </div>
              
              {/* Search Bar */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by title, party name, or date..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="p-8">
            {filteredDrafts.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <svg className="h-10 w-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {searchQuery ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    )}
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {searchQuery 
                    ? 'No results found' 
                    : filterStatus === 'ALL' ? 'No NDAs yet' : `No ${filterStatus.toLowerCase()} NDAs`}
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {searchQuery 
                    ? `No NDAs match "${searchQuery}". Try a different search term.`
                    : filterStatus === 'ALL' 
                      ? 'Get started by creating your first Non-Disclosure Agreement. It only takes a few minutes!' 
                      : `You don't have any ${filterStatus.toLowerCase()} NDAs. Try selecting a different filter or create a new NDA.`}
                </p>
                {filterStatus === 'ALL' && !searchQuery && (
                  <Link 
                    href="/fillnda"
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
                  >
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create Your First NDA
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDrafts.map((draft) => (
                  <div
                    key={draft.id}
                    className="flex items-center justify-between p-5 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all group"
                  >
                    <div className="flex items-center space-x-4">
                      {draft.status === 'DRAFT' ? (
                        <div className="h-12 w-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center group-hover:from-gray-200 group-hover:to-gray-300 transition-colors">
                          <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </div>
                      ) : draft.status === 'SENT' ? (
                        <div className="h-12 w-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center group-hover:from-purple-200 group-hover:to-purple-300 transition-colors">
                          <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                        </div>
                      ) : draft.status === 'SIGNED' ? (
                        <div className="h-12 w-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center group-hover:from-green-200 group-hover:to-green-300 transition-colors">
                          <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      ) : (
                        <div className="h-12 w-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center group-hover:from-blue-200 group-hover:to-purple-200 transition-colors">
                          <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-base">{draft.title}</h3>
                        <div className="flex items-center gap-3 mt-0.5">
                          <p className="text-sm text-gray-600">
                            Updated {new Date(draft.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                          {draft.status === 'SENT' && draft.signers && draft.signers.length > 0 && (
                            <>
                              <span className="text-gray-400">•</span>
                              <p className="text-sm text-gray-600 flex items-center gap-1">
                                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                </svg>
                                Sent to: <span className="font-medium text-purple-700">{draft.signers[0].email}</span>
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(draft.status)}`}>
                        {draft.status}
                      </span>
                      <div className="flex space-x-2">
                        <Link 
                          href={`/viewpdf/${draft.id}`}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium text-gray-700 bg-white rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all"
                        >
                          <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View
                        </Link>
                        {draft.status === 'DRAFT' && (
                          <Link 
                            href={`/fillnda?draftId=${draft.id}`}
                            className="inline-flex items-center px-4 py-2 border border-blue-300 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 hover:border-blue-400 transition-all"
                          >
                            <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
