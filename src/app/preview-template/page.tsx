'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';

export default function PreviewTemplatePage() {
  const searchParams = useSearchParams();
  const templateId = searchParams.get('template') || 'design_mutual_nda_v1';
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadPreview = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Sample data for preview
      const sampleData = {
        doc_title: 'Sample Mutual NDA',
        effective_date_long: 'November 10, 2025',
        party_1_name: 'Acme Corporation',
        party_1_address: '123 Business St, Suite 100, San Francisco, CA 94102',
        party_1_phone: '+1 (555) 123-4567',
        party_1_emails_joined: 'legal@acme.com',
        party_1_signatory_name: 'John Smith',
        party_1_signatory_title: 'CEO',
        party_2_name: 'Beta Industries Ltd',
        party_2_address: '456 Commerce Ave, New York, NY 10001',
        party_2_phone: '+1 (555) 987-6543',
        party_2_emails_joined: 'contracts@beta.com',
        party_2_signatory_name: 'Jane Doe',
        party_2_signatory_title: 'Director',
        information_scope_text: 'All information, materials, documents, data, and other content',
        purpose: 'exploring a potential business partnership and evaluating commercial opportunities',
        governing_law_full: 'California',
        term_years_number: '3',
        term_years_words: 'three',
      };

      const res = await fetch('/api/ndas/preview-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, ...sampleData }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.details || 'Failed to generate preview');
      }

      const data = await res.json();
      setHtml(data.html || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preview');
    } finally {
      setLoading(false);
    }
  }, [templateId]);

  useEffect(() => {
    loadPreview();
  }, [loadPreview]);

  // Auto-refresh every 2 seconds if enabled
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      loadPreview();
    }, 2000);

    return () => clearInterval(interval);
  }, [autoRefresh, loadPreview]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Control Bar */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-gray-900">
              🎨 Live Template Preview
            </h1>
            <span className="text-sm text-gray-500">
              {templateId}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Auto-refresh toggle */}
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-700">Auto-refresh (2s)</span>
            </label>

            {/* Manual refresh */}
            <button
              onClick={loadPreview}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '🔄 Refreshing...' : '🔄 Refresh Now'}
            </button>

            {/* Template selector */}
            <select
              value={templateId}
              onChange={(e) => {
                const url = new URL(window.location.href);
                url.searchParams.set('template', e.target.value);
                window.history.pushState({}, '', url);
                window.location.reload();
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="design_mutual_nda_v1">design_mutual_nda_v1</option>
              <option value="professional_mutual_nda_v1">professional_mutual_nda_v1 ✨</option>
              <option value="mutual_nda_v1">mutual_nda_v1</option>
              <option value="mutual-nda-html">mutual-nda-html</option>
              <option value="mutual-nda-html-v2">mutual-nda-html-v2</option>
            </select>
          </div>
        </div>
      </div>

      {/* Preview Area */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 font-medium">Error loading preview</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        )}

        {loading && !html ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Loading template preview...</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div 
              className="preview-content"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="fixed bottom-4 right-4 bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-sm shadow-lg">
        <h3 className="font-semibold text-blue-900 mb-2">💡 How to use</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Edit your .hbs file and save</li>
          <li>• Changes appear automatically in 2 seconds</li>
          <li>• Toggle auto-refresh off for manual control</li>
          <li>• Switch templates using the dropdown</li>
        </ul>
      </div>
    </div>
  );
}
