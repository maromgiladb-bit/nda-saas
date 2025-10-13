'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'

interface Draft {
  id: string
  title: string
  status: string
  data: Record<string, string | number | boolean>
  preview_key: string
  final_key: string
  created_at: string
  updated_at: string
  signers: Array<{
    id: string
    email: string
    role: string
    status: string
    signed_at: string | null
  }>
}

export default function ViewPDF() {
  const params = useParams()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [loading, setLoading] = useState(true)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)

  const fetchDraft = useCallback(async () => {
    try {
      const response = await fetch(`/api/ndas/drafts/${params.id}`)
      const data = await response.json()
      if (data.draft) {
        setDraft(data.draft)
        // Generate PDF preview
        generatePreview(data.draft)
      }
    } catch (error) {
      console.error('Error fetching draft:', error)
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    if (params.id) {
      fetchDraft()
    }
  }, [params.id, fetchDraft])

  const generatePreview = async (draftData: Draft) => {
    try {
      const response = await fetch('/api/ndas/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          draftId: draftData.id,
          data: draftData.data 
        })
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        setPdfUrl(url)
      }
    } catch (error) {
      console.error('Error generating preview:', error)
    }
  }

  const sendForSignature = async () => {
    if (!draft) return

    try {
      const signers = [
        { email: 'signer@example.com', role: 'party1' },
        // Add more signers as needed
      ]

      const response = await fetch('/api/ndas/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          draftId: draft.id,
          signers 
        })
      })

      if (response.ok) {
        alert('NDA sent for signature!')
        fetchDraft() // Refresh data
      }
    } catch (error) {
      console.error('Error sending for signature:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800'
      case 'SENT': return 'bg-blue-100 text-blue-800'
      case 'SIGNED': return 'bg-green-100 text-green-800'
      case 'VOID': return 'bg-red-100 text-red-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!draft) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Draft not found</h2>
          <p className="text-gray-600">The requested NDA draft could not be found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{draft.title}</h1>
              <p className="text-gray-600 mt-2">
                Created on {new Date(draft.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(draft.status)}`}>
                {draft.status}
              </span>
              {draft.status === 'DRAFT' && (
                <button
                  onClick={sendForSignature}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Send for Signature
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* PDF Viewer */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Document Preview</h3>
              </div>
              <div className="p-6">
                {pdfUrl ? (
                  <embed
                    src={pdfUrl}
                    type="application/pdf"
                    width="100%"
                    height="600"
                    className="border border-gray-300 rounded"
                  />
                ) : (
                  <div className="flex items-center justify-center h-96 bg-gray-100 rounded">
                    <p className="text-gray-500">Generating PDF preview...</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Document Info */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Document Info</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(draft.status)}`}>
                    {draft.status}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(draft.created_at).toLocaleDateString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(draft.updated_at).toLocaleDateString()}
                  </dd>
                </div>
              </div>
            </div>

            {/* Signers */}
            {draft.signers && draft.signers.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Signers</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {draft.signers.map((signer) => (
                      <div key={signer.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{signer.email}</p>
                          <p className="text-xs text-gray-500">{signer.role}</p>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(signer.status)}`}>
                          {signer.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Actions</h3>
              </div>
              <div className="p-6 space-y-3">
                {pdfUrl && (
                  <a
                    href={pdfUrl}
                    download={`${draft.title}.pdf`}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium text-gray-700 bg-white rounded-md hover:bg-gray-50"
                  >
                    Download PDF
                  </a>
                )}
                {draft.status === 'DRAFT' && (
                  <a
                    href={`/fillnda?draftId=${draft.id}`}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium text-gray-700 bg-white rounded-md hover:bg-gray-50"
                  >
                    Edit Document
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
