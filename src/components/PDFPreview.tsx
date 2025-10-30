'use client'

import { useEffect, useRef, useState } from 'react'

interface PDFPreviewProps {
  base64: string
  className?: string
  showFullViewer?: boolean
}

/**
 * Read-only PDF preview component
 * Renders a PDF from base64 data using PDF.js viewer
 */
export default function PDFPreview({ base64, className = '', showFullViewer = true }: PDFPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [dataUrl, setDataUrl] = useState<string>('')

  useEffect(() => {
    if (base64) {
      // Create data URL from base64
      const url = `data:application/pdf;base64,${base64}`
      setDataUrl(url)
    }
  }, [base64])

  if (!dataUrl) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <div className="text-gray-500">Loading PDF...</div>
      </div>
    )
  }

  if (showFullViewer) {
    // Use PDF.js full viewer (if available in /pdfjs/)
    return (
      <iframe
        ref={iframeRef}
        src={`/pdfjs/web/viewer.html?file=${encodeURIComponent(dataUrl)}`}
        className={`w-full border-0 ${className}`}
        style={{ minHeight: '600px' }}
        title="PDF Preview"
      />
    )
  }

  // Fallback: simple iframe embed
  return (
    <iframe
      ref={iframeRef}
      src={dataUrl}
      className={`w-full border-0 ${className}`}
      style={{ minHeight: '600px' }}
      title="PDF Preview"
    />
  )
}
