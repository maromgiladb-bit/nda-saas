"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PDFPreview from "@/components/PDFPreview";

export default function SignNDASimplePage() {
  const router = useRouter();
  const [ndaData, setNdaData] = useState<{
    draftId: string;
    values: Record<string, string | boolean>;
    htmlContent: string;
    partyAEmail: string;
    partyAName: string;
    partyBEmail: string;
    partyBName: string;
  } | null>(null);
  
  const [partyASignature, setPartyASignature] = useState({
    name: "",
    title: "",
    date: new Date().toISOString().split("T")[0],
  });
  
  const [loading, setLoading] = useState(false);
  const [generatingPreview, setGeneratingPreview] = useState(true);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    // Load NDA data from session storage
    const data = sessionStorage.getItem('ndaSignData');
    if (data) {
      const parsed = JSON.parse(data);
      setNdaData(parsed);
      // Pre-fill signature name
      setPartyASignature(prev => ({ ...prev, name: parsed.partyAName || "" }));
    } else {
      // No data found, redirect back
      router.push('/fillndahtml');
    }
  }, [router]);

  useEffect(() => {
    if (ndaData?.htmlContent) {
      setGeneratingPreview(true);
      fetch('/api/html-to-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ htmlContent: ndaData.htmlContent }),
      })
      .then(res => res.json())
      .then(data => {
        setPdfPreviewUrl(data.fileUrl);
      })
      .catch(error => {
        console.error("Failed to generate PDF preview:", error);
        alert("Could not generate PDF preview.");
      })
      .finally(() => {
        setGeneratingPreview(false);
      });
    }
  }, [ndaData?.htmlContent]);

  const handleSign = async () => {
    if (!partyASignature.name.trim()) {
      alert("Please enter your name");
      return;
    }

    setLoading(true);
    try {
      // Save signature and generate final PDF
      const response = await fetch("/api/sign-nda-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ndaId: ndaData!.draftId,
          htmlContent: ndaData!.htmlContent,
          partyASignature,
          partyBSignature: {
            name: ndaData!.partyBName,
            title: "",
            date: "",
          },
        }),
      });

      if (!response.ok) throw new Error("Failed to save signature");

      await response.json();
      
      // Clear session storage
      sessionStorage.removeItem('ndaSignData');
      
      alert("✅ Signature saved! PDF generated successfully.");
      router.push(`/dashboard`);
    } catch (error) {
      console.error("Signing failed:", error);
      alert("Failed to save signature. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!ndaData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 mx-auto mb-4 text-teal-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-navy-900 shadow-lg flex-shrink-0" style={{ backgroundColor: '#001f3f' }}>
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-white">Sign Your NDA</h1>
          <p className="text-blue-100 mt-2">
            Review the document and add your signature
          </p>
        </div>
      </div>

      {/* Main Content - Split Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT SIDE: Signature Form */}
        <div className="w-1/3 overflow-y-auto bg-white border-r border-gray-300">
          <div className="p-8">
            {/* Party Info Card */}
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-5 mb-8">
              <h3 className="font-semibold text-teal-900 mb-3 text-lg">Signing as Party A</h3>
              <div className="space-y-2">
                <p className="text-sm text-teal-700">
                  <strong className="font-medium">Name:</strong> {ndaData.partyAName}
                </p>
                <p className="text-sm text-teal-700">
                  <strong className="font-medium">Email:</strong> {ndaData.partyAEmail}
                </p>
              </div>
            </div>

            {/* Signature Form */}
            <div className="bg-gradient-to-br from-teal-50 to-teal-100 border-2 border-teal-300 rounded-xl p-8 shadow-lg mb-8">
              <h2 className="text-2xl font-bold mb-3 text-teal-900">Your Signature</h2>
              <p className="text-teal-800 mb-6 leading-relaxed">
                Please provide your signature details below
              </p>
              
              <div className="bg-white border-2 border-teal-200 rounded-lg p-6 mb-6 shadow-sm">
                <div className="grid grid-cols-1 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={partyASignature.name}
                      onChange={(e) => setPartyASignature({ ...partyASignature, name: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                      placeholder="Enter your full name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Title / Position
                    </label>
                    <input
                      type="text"
                      value={partyASignature.title}
                      onChange={(e) => setPartyASignature({ ...partyASignature, title: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                      placeholder="e.g., CEO, Manager"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      value={partyASignature.date}
                      onChange={(e) => setPartyASignature({ ...partyASignature, date: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleSign}
                disabled={loading || !partyASignature.name.trim()}
                className="w-full bg-teal-600 text-white px-8 py-4 rounded-lg hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-bold text-lg flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing...
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Sign & Complete
                  </>
                )}
              </button>
            </div>

            {/* Info Note */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-5">
              <div className="flex gap-3">
                <svg className="w-6 h-6 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm text-blue-800 font-semibold mb-1">What happens next?</p>
                  <p className="text-sm text-blue-700">
                    After you sign, Party B ({ndaData.partyBName}) will be notified to review and sign the document.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: PDF Preview */}
        <div className="w-2/3 overflow-hidden bg-gray-100">
          <div className="h-full flex flex-col p-6">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col h-full">
              {/* Preview Header */}
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center gap-3 flex-shrink-0">
                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-lg font-semibold text-gray-800">Document Preview</span>
              </div>
              
              {/* Document Content */}
              <div className="flex-1 overflow-hidden">
                {generatingPreview ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="text-center">
                      <svg className="animate-spin h-12 w-12 mx-auto mb-4 text-teal-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p className="text-gray-600">Generating PDF Preview...</p>
                    </div>
                  </div>
                ) : pdfPreviewUrl ? (
                  <PDFPreview base64={pdfPreviewUrl.split(',')[1]} className="h-full" showFullViewer={true} />
                ) : (
                  <div className="p-8 overflow-y-auto h-full">
                    <div className="prose prose-sm max-w-none">
                      <div dangerouslySetInnerHTML={{ __html: ndaData.htmlContent }} />
                    </div>
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