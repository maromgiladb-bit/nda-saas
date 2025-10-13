'use client'

import { useAuth } from '@clerk/nextjs'
import { useState } from 'react'

export default function TestAuth() {
  const { userId, isLoaded, isSignedIn } = useAuth()
  const [apiResult, setApiResult] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState<string | null>(null)

  const testApi = async () => {
    try {
      setError(null)
      console.log('Testing API...')
      const response = await fetch('/api/ndas/drafts')
      console.log('Response status:', response.status)
      
      const data = await response.json()
      console.log('Response data:', data)
      setApiResult(data)
    } catch (err) {
      console.error('API Error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Authentication Test</h1>
      
      <div className="space-y-4">
        <div>
          <strong>Auth Status:</strong>
          <ul className="ml-4">
            <li>isLoaded: {isLoaded ? 'true' : 'false'}</li>
            <li>isSignedIn: {isSignedIn ? 'true' : 'false'}</li>
            <li>userId: {userId || 'null'}</li>
          </ul>
        </div>

        <button 
          onClick={testApi}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Test API
        </button>

        {error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            Error: {error}
          </div>
        )}

        {apiResult && (
          <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            <strong>API Result:</strong>
            <pre className="mt-2 text-sm">{JSON.stringify(apiResult, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  )
}