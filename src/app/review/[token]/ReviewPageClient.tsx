'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Comment {
  author: string
  text: string
  ts: string
}

interface Change {
  path: string
  field: string
  before: unknown
  after: unknown
  type: 'added' | 'modified' | 'deleted'
}

interface Props {
  token: string
  draft: {
    id: string
    title: string
    data: Record<string, unknown>
  }
  revision: {
    id: string
    number: number
    message: string | null
    actor_role: string
  }
  changes: Change[]
  comments: Record<string, Comment[]>
  provisionallySignedByRecipient: boolean
}

export default function ReviewPageClient({
  token,
  draft,
  revision,
  changes,
  comments: initialComments,
  provisionallySignedByRecipient
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [requestChangesMessage, setRequestChangesMessage] = useState('')
  const [showRequestChanges, setShowRequestChanges] = useState(false)
  const [comments, setComments] = useState(initialComments)
  const [newComments, setNewComments] = useState<Record<string, string>>({})

  const handleApprove = async (andSign: boolean = false) => {
    if (!confirm(andSign ? 'Approve and sign this NDA?' : 'Approve these changes?')) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/review/approve/${token}`, {
        method: 'POST'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve')
      }

      if (data.finalized) {
        alert('NDA fully signed! Check your email for the final document.')
      } else {
        alert('Changes approved! Recipient will be notified to sign.')
      }

      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve')
    } finally {
      setLoading(false)
    }
  }

  const handleRequestChanges = async () => {
    if (!requestChangesMessage.trim()) {
      alert('Please enter a message explaining what changes are needed.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/review/request-more/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: requestChangesMessage })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to request changes')
      }

      alert('Changes requested! Recipient will be notified.')
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request changes')
    } finally {
      setLoading(false)
    }
  }

  const handleAddComment = async (path: string) => {
    const text = newComments[path]?.trim()
    if (!text) return

    try {
      const response = await fetch(`/api/revisions/${revision.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, text, author: 'OWNER' })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add comment')
      }

      setComments(prev => ({
        ...prev,
        [path]: data.comments
      }))

      setNewComments(prev => ({
        ...prev,
        [path]: ''
      }))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add comment')
    }
  }

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return '(empty)'
    if (typeof value === 'object') return JSON.stringify(value, null, 2)
    return String(value)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{draft.title}</h1>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
                  Revision #{revision.number}
                </span>
              </div>
              <p className="text-gray-600">Review changes submitted by the recipient</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Submitted by</div>
              <div className="font-semibold text-gray-900">{revision.actor_role}</div>
            </div>
          </div>

          {revision.message && (
            <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
              <div className="text-sm font-semibold text-blue-900 mb-1">Message from recipient:</div>
              <div className="text-blue-800">{revision.message}</div>
            </div>
          )}

          {provisionallySignedByRecipient && (
            <div className="mt-4 p-4 bg-green-50 border-l-4 border-green-500 rounded flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold text-green-900">Recipient has provisionally signed. Approving will finalize the NDA.</span>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-8">
            {error}
          </div>
        )}

        {/* Changes Table */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          <div className="px-8 py-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Tracked Changes ({changes.length})</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Field</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Before</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">After</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Comments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {changes.map((change, idx) => {
                  const pathComments = comments[change.path] || []
                  const hasComments = pathComments.length > 0

                  return (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{change.field}</span>
                          {hasComments && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                              {pathComments.length}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-red-600 font-mono bg-red-50 p-2 rounded max-w-xs overflow-auto">
                          {formatValue(change.before)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-green-600 font-mono bg-green-50 p-2 rounded max-w-xs overflow-auto">
                          {formatValue(change.after)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2 max-w-md">
                          {/* Existing comments */}
                          {pathComments.map((comment, commentIdx) => (
                            <div
                              key={commentIdx}
                              className={`text-sm p-2 rounded ${
                                comment.author === 'OWNER'
                                  ? 'bg-blue-50 border-l-2 border-blue-500'
                                  : 'bg-gray-50 border-l-2 border-gray-400'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-xs text-gray-700">
                                  {comment.author}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(comment.ts).toLocaleString()}
                                </span>
                              </div>
                              <div className="text-gray-800">{comment.text}</div>
                            </div>
                          ))}

                          {/* Add comment input */}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Add comment..."
                              value={newComments[change.path] || ''}
                              onChange={(e) => setNewComments(prev => ({ ...prev, [change.path]: e.target.value }))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleAddComment(change.path)
                                }
                              }}
                            />
                            <button
                              onClick={() => handleAddComment(change.path)}
                              className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            >
                              💬
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Review Actions</h2>

          {!showRequestChanges ? (
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => handleApprove(false)}
                disabled={loading}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Processing...' : 'Approve Changes'}
              </button>

              {provisionallySignedByRecipient && (
                <button
                  onClick={() => handleApprove(true)}
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
                >
                  {loading ? 'Processing...' : 'Approve & Sign Now'}
                </button>
              )}

              <button
                onClick={() => setShowRequestChanges(true)}
                disabled={loading}
                className="px-6 py-3 bg-yellow-600 text-white rounded-lg font-semibold hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Request More Changes
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Message to Recipient (required)
                </label>
                <textarea
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  placeholder="Explain what changes are needed..."
                  value={requestChangesMessage}
                  onChange={(e) => setRequestChangesMessage(e.target.value)}
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleRequestChanges}
                  disabled={loading || !requestChangesMessage.trim()}
                  className="px-6 py-3 bg-yellow-600 text-white rounded-lg font-semibold hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Sending...' : 'Send Request'}
                </button>
                <button
                  onClick={() => {
                    setShowRequestChanges(false)
                    setRequestChangesMessage('')
                  }}
                  disabled={loading}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
