"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SignatureBlock } from "@/components/SignatureBlock";
import PDFPreview from "@/components/PDFPreview";

export default function SignPage() {
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
  const [signatureMethod, setSignatureMethod] = useState<"manual" | "docusign" | null>(null);
  const [partyASignature, setPartyASignature] = useState({
    name: "",
    title: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [partyBSignature, setPartyBSignature] = useState({
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
      // Pre-fill signature names
      setPartyASignature(prev => ({ ...prev, name: parsed.partyAName || "" }));
      setPartyBSignature(prev => ({ ...prev, name: parsed.partyBName || "" }));
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

  const handleManualSign = async () => {
    setLoading(true);
    try {
      // Save signatures and generate final PDF
      const response = await fetch("/api/sign-nda-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ndaId: ndaData.draftId,
          htmlContent: ndaData.htmlContent,
          partyASignature,
          partyBSignature,
        }),
      });

      if (!response.ok) throw new Error("Failed to save signatures");

      await response.json();
      
      // Clear session storage
      sessionStorage.removeItem('ndaSignData');
      
      alert("✅ Signatures saved! PDF generated with signature fields.");
      router.push(`/dashboard`);
    } catch (error) {
      console.error("Manual signing failed:", error);
      alert("Failed to save signatures. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDocuSignSend = async () => {
    setLoading(true);
    try {
      // Send via DocuSign
      const response = await fetch("/api/send-docusign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ndaId: ndaData.draftId,
          htmlContent: ndaData.htmlContent,
          partyAEmail: ndaData.partyAEmail,
          partyAName: ndaData.partyAName,
          partyBEmail: ndaData.partyBEmail,
          partyBName: ndaData.partyBName,
          documentName: ndaData.values?.docName || "Mutual NDA",
        }),
      });

      if (!response.ok) throw new Error("Failed to send via DocuSign");

      const data = await response.json();
      
      // Clear session storage
      sessionStorage.removeItem('ndaSignData');
      
      alert(`✅ NDA sent via DocuSign!\n\nEnvelope ID: ${data.envelopeId}\n\nBoth parties will receive an email to sign.`);
      router.push(`/dashboard`);
    } catch (error) {
      console.error("DocuSign sending failed:", error);
      alert("Failed to send via DocuSign. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-teal-600 shadow-lg flex-shrink-0">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-white">Sign Your NDA</h1>
          <p className="text-teal-100 mt-2">
            Review the document and choose your signing method
          </p>
        </div>
      </div>

      {/* Main Content - Split Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT SIDE: Signing Options */}
        <div className="w-1/2 overflow-y-auto bg-white border-r border-gray-200">
          <div className="max-w-2xl mx-auto p-8">
            {/* Party Info */}
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

            {/* Signature Method Selection */}
            {!signatureMethod && (
              <div className="space-y-5">
                <h2 className="text-2xl font-bold mb-6 text-gray-900">Choose Your Signing Method</h2>
                
                {/* DocuSign Option */}
                <button
                  onClick={() => setSignatureMethod("docusign")}
                  className="w-full p-8 border-2 border-teal-500 rounded-xl hover:bg-teal-50 hover:shadow-lg transition-all text-left group"
                >
                  <div className="flex items-start gap-5">
                    <div className="w-14 h-14 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-teal-200 transition">
                      <svg className="w-7 h-7 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-teal-700 mb-3">
                        🔐 Sign with DocuSign <span className="text-sm bg-teal-100 text-teal-700 px-2 py-1 rounded ml-2">Recommended</span>
                      </h3>
                      <p className="text-gray-700 mb-4 leading-relaxed">
                        Electronic signature with full legal validity. Both parties will receive an email to sign digitally.
                      </p>
                      <ul className="text-sm text-gray-600 space-y-2">
                        <li className="flex items-center gap-2">
                          <span className="text-teal-500 font-bold">✓</span> Legally binding electronic signature
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-teal-500 font-bold">✓</span> Automatic email notifications
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-teal-500 font-bold">✓</span> Audit trail and certificate
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-teal-500 font-bold">✓</span> Both parties sign remotely
                        </li>
                      </ul>
                    </div>
                  </div>
                </button>

                {/* Manual Option */}
                <button
                  onClick={() => setSignatureMethod("manual")}
                  className="w-full p-8 border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 hover:shadow-lg transition-all text-left group"
                >
                  <div className="flex items-start gap-5">
                    <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-gray-200 transition">
                      <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-700 mb-3">
                        ✍️ Manual Signature
                      </h3>
                      <p className="text-gray-700 mb-4 leading-relaxed">
                        Enter signature details manually. Document will be generated with signature fields for printing and signing.
                      </p>
                      <ul className="text-sm text-gray-600 space-y-2">
                        <li className="flex items-center gap-2">
                          <span className="text-gray-400 font-bold">✓</span> Traditional signature method
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-gray-400 font-bold">✓</span> Print and sign physically
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-gray-400 font-bold">✓</span> Suitable for in-person signing
                        </li>
                      </ul>
                    </div>
                  </div>
                </button>
              </div>
            )}

            {/* DocuSign Flow */}
            {signatureMethod === "docusign" && (
              <div className="space-y-6">
                <button
                  onClick={() => setSignatureMethod(null)}
                  className="text-teal-600 hover:text-teal-700 flex items-center gap-2 mb-6 font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to options
                </button>

                <div className="bg-gradient-to-br from-teal-50 to-teal-100 border-2 border-teal-300 rounded-xl p-8 shadow-lg">
                  <h2 className="text-2xl font-bold mb-3 text-teal-900">Send via DocuSign</h2>
                  <p className="text-teal-800 mb-6 leading-relaxed">
                    Both you and Party B will receive an email with instructions to sign electronically.
                  </p>
                  
                  <div className="bg-white rounded-lg p-5 mb-6 border border-teal-200 shadow-sm">
                    <p className="text-sm font-semibold text-gray-700 mb-3">Party B will receive:</p>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-teal-500 mt-0.5">📧</span>
                        <span><strong>Email to:</strong> {ndaData.partyBEmail}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-teal-500 mt-0.5">🔒</span>
                        <span>Secure signing link</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-teal-500 mt-0.5">🔔</span>
                        <span>Notification when you sign first</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={handleDocuSignSend}
                    disabled={loading}
                    className="w-full bg-teal-600 text-white px-8 py-4 rounded-lg hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-bold text-lg flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </>
                    ) : (
                      <>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        Send via DocuSign
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Manual Signature Flow - Only Party A fills */}
            {signatureMethod === "manual" && (
              <div className="space-y-6">
                <button
                  onClick={() => setSignatureMethod(null)}
                  className="text-teal-600 hover:text-teal-700 flex items-center gap-2 mb-6 font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to options
                </button>

                <div className="bg-gray-50 border-2 border-gray-300 rounded-xl p-8 shadow-lg">
                  <h2 className="text-2xl font-bold mb-3 text-gray-900">Your Signature Details</h2>
                  <p className="text-gray-700 mb-6 leading-relaxed">
                    Enter your signature information. Party B will fill theirs later.
                  </p>
                  
                  {/* Party A Only */}
                  <div className="bg-white border-2 border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
                    <h3 className="font-bold mb-4 text-gray-800 text-lg">Party A Signature (You)</h3>
                    <div className="grid grid-cols-1 gap-5">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Print Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={partyASignature.name}
                          onChange={(e) => setPartyASignature({ ...partyASignature, name: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                          placeholder="Full Name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Title
                        </label>
                        <input
                          type="text"
                          value={partyASignature.title}
                          onChange={(e) => setPartyASignature({ ...partyASignature, title: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                          placeholder="Job Title"
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

                  <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-5 mb-6">
                    <div className="flex gap-3">
                      <svg className="w-6 h-6 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-yellow-800">
                        <strong className="font-semibold">Note:</strong> Party B will fill their signature details when they receive the document.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleManualSign}
                    disabled={loading || !partyASignature.name}
                    className="w-full bg-teal-600 text-white px-8 py-4 rounded-lg hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-bold text-lg flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating PDF...
                      </>
                    ) : (
                      <>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Generate PDF with Signature Fields
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDE: Document Preview */}
        <div className="w-1/2 overflow-hidden bg-gray-100">
          <div className="h-full flex flex-col p-8">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col h-full">
              {/* Preview Header */}
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center gap-3 flex-shrink-0">
                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-lg font-semibold text-gray-800">PDF Preview</span>
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
                      {/* Fallback to HTML if PDF fails */}
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
