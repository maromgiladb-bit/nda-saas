'use client';
import { useState, useEffect } from 'react';
import PrivateToolbar from '@/components/PrivateToolbar';
import { useUser, RedirectToSignIn } from '@clerk/nextjs';

interface TemplateInfo {
  id: string;
  name: string;
  version: string;
  category: string;
  description: string;
  templateFile: string;
  isActive: boolean;
  requiredFields: string[];
  optionalFields: string[];
}

export default function DevTemplatesPage() {
  const { isLoaded, user } = useUser();
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<Record<string, string>>({});
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showRawTemplate, setShowRawTemplate] = useState(false);
  const [rawTemplateContent, setRawTemplateContent] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/templates/list');
      if (!res.ok) throw new Error('Failed to load templates');
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const loadPreview = async (templateId: string) => {
    try {
      setPreviewLoading(true);
      setPreviewHtml('');
      setRawTemplateContent('');
      
      // Load raw template content
      const template = templates.find(t => t.id === templateId);
      if (template) {
        try {
          const rawRes = await fetch(`/api/templates/raw?file=${encodeURIComponent(template.templateFile)}`);
          if (rawRes.ok) {
            const rawContent = await rawRes.text();
            setRawTemplateContent(rawContent);
          } else {
            console.error('Raw template fetch failed', rawRes.status);
            setRawTemplateContent('Failed to load template');
          }
        } catch (e) {
          console.error('Failed to load raw template:', e);
          setRawTemplateContent('Failed to load template');
        }
      }
      
      // Generate sample data
      const sampleData: Record<string, string> = {
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

      if (!res.ok) throw new Error('Failed to generate preview');
      const data = await res.json();
      setPreviewHtml(data.html || '');
      setPreviewData(sampleData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  if (!isLoaded) return <div className="min-h-screen">Loading...</div>;
  if (!user) return <RedirectToSignIn />;

  return (
    <div className="min-h-screen bg-gray-50">
      <PrivateToolbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔧 Dev Templates Viewer
          </h1>
          <p className="text-gray-600">
            View and test HTML templates (Development Only)
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Templates List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">Available Templates</h2>
              </div>
              
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading templates...</p>
                </div>
              ) : templates.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <p>No templates found</p>
                  <p className="text-sm mt-2">Check template-config.json</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className={`p-4 cursor-pointer transition-colors ${
                        selectedTemplate === template.id
                          ? 'bg-blue-50 border-l-4 border-l-blue-500'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        setSelectedTemplate(template.id);
                        loadPreview(template.id);
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {template.name}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {template.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                              v{template.version}
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                              {template.category}
                            </span>
                            {template.isActive && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                                Active
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 text-xs text-gray-500">
                        <p>📄 File: {template.templateFile}</p>
                        {template.requiredFields && (
                          <p>✅ Required: {template.requiredFields.length} fields</p>
                        )}
                        {template.optionalFields && (
                          <p>⚪ Optional: {template.optionalFields.length} fields</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {selectedTemplate ? `Preview: ${selectedTemplate}` : 'Select a template'}
                  </h2>
                  {selectedTemplate && (
                    <a
                      href={`/fillndahtml?templateId=${selectedTemplate}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Open in Form →
                    </a>
                  )}
                </div>
                
                {/* Toggle between Preview and Raw */}
                {selectedTemplate && (
                  <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg w-fit">
                    <button
                      onClick={() => setShowRawTemplate(false)}
                      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        !showRawTemplate
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      📄 Preview with Data
                    </button>
                    <button
                      onClick={() => setShowRawTemplate(true)}
                      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        showRawTemplate
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      🔧 Raw Template
                    </button>
                  </div>
                )}
              </div>
              
              <div className="p-4">
                {!selectedTemplate ? (
                  <div className="text-center py-20 text-gray-400">
                    <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p>Select a template to preview</p>
                  </div>
                ) : previewLoading ? (
                  <div className="text-center py-20">
                    <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                  </div>
                ) : showRawTemplate ? (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Raw Template Source (.hbs)</span>
                      <button
                        onClick={() => {
                          const blob = new Blob([rawTemplateContent], { type: 'text/plain' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${selectedTemplate}.hbs`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        Download .hbs
                      </button>
                    </div>
                    <pre className="p-4 bg-gray-900 text-green-400 text-xs max-h-[600px] overflow-auto font-mono">
                      <code>{rawTemplateContent || 'Loading template...'}</code>
                    </pre>
                  </div>
                ) : previewHtml ? (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">HTML Preview (Sample Data)</span>
                      <button
                        onClick={() => {
                          const blob = new Blob([previewHtml], { type: 'text/html' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${selectedTemplate}_preview.html`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        Download HTML
                      </button>
                    </div>
                    <div 
                      className="p-4 bg-white max-h-[600px] overflow-y-auto"
                      dangerouslySetInnerHTML={{ __html: previewHtml }}
                    />
                  </div>
                ) : (
                  <div className="text-center py-20 text-red-500">
                    <p>Failed to load preview</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
