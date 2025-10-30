'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@clerk/nextjs'

interface Draft {
  id: string
  title: string
  status: string
  data: Record<string, string | number | boolean>
  created_at: string
  updated_at: string
}

export default function MyDrafts() {
  const { userId, isLoaded } = useAuth()
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log('=== MyDrafts useEffect ===')
    console.log('isLoaded:', isLoaded)
    console.log('userId:', userId)
    
    if (isLoaded) {
      if (userId) {
        console.log('User is authenticated, fetching drafts...')
        fetchDrafts()
      } else {
        console.log('User is not authenticated')
        setLoading(false)
        setError('Please sign in to view your drafts')
      }
    } else {
      console.log('Auth not loaded yet...')
    }
  }, [userId, isLoaded])

  const fetchDrafts = async () => {
    console.log('=== fetchDrafts called ===')
    try {
      setError(null)
      console.log('Making fetch request to /api/ndas/drafts')
      
      const response = await fetch('/api/ndas/drafts')
      console.log('Response received:', response.status, response.statusText)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('API Error:', response.status, errorData)
        throw new Error(`Failed to fetch drafts: ${response.status} ${errorData.error || 'Unknown error'}`)
      }
      
      const data = await response.json()
      console.log('Fetched drafts data:', data)
      
      if (data.drafts) {
        // Filter only DRAFT status
        const draftOnly = data.drafts.filter((draft: Draft) => draft.status === 'DRAFT')
        console.log('Filtered drafts:', draftOnly.length)
        setDrafts(draftOnly)
      } else {
        console.log('No drafts in response')
        setDrafts([])
      }
    } catch (error) {
      console.error('Error fetching drafts:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setError('Failed to fetch drafts: ' + errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const deleteDraft = async (draftId: string) => {
    if (!confirm('Are you sure you want to delete this draft?')) return

    try {
      const response = await fetch(`/api/ndas/drafts/${draftId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setDrafts(drafts.filter(draft => draft.id !== draftId))
      }
    } catch (error) {
      console.error('Error deleting draft:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Drafts</h1>
            <p className="text-gray-600 mt-2">Manage your NDA drafts and continue editing</p>
          </div>
          <Link 
            href="/fillnda?new=true"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create New Draft
          </Link>
        </div>

        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {drafts.length === 0 && !error ? (
          <div className="text-center py-12">
            <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No drafts yet</h3>
            <p className="text-gray-600 mb-4">Start creating your first NDA draft</p>
            <Link 
              href="/fillnda?new=true"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Create Your First Draft
            </Link>
          </div>
        ) : drafts.length > 0 ? (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Draft NDAs ({drafts.length})</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {drafts.map((draft) => (
                <div key={draft.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-lg font-medium text-gray-900">{draft.title}</h4>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm text-gray-500">
                          Created: {new Date(draft.created_at).toLocaleDateString()}
                        </span>
                        <span className="text-sm text-gray-500">
                          Updated: {new Date(draft.updated_at).toLocaleDateString()}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          {draft.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Link
                        href={`/fillnda?draftId=${draft.id}`}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm text-gray-700 bg-white rounded-md hover:bg-gray-50"
                      >
                        <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </Link>
                      <Link
                        href={`/viewpdf/${draft.id}`}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm text-gray-700 bg-white rounded-md hover:bg-gray-50"
                      >
                        <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Preview
                      </Link>
                      <button
                        onClick={() => deleteDraft(draft.id)}
                        className="inline-flex items-center px-3 py-1 border border-red-300 text-sm text-red-700 bg-white rounded-md hover:bg-red-50"
                      >
                        <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}