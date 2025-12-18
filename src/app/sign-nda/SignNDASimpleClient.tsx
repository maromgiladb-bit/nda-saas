"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Great_Vibes } from 'next/font/google';
import PublicToolbar from '@/components/PublicToolbar';

const greatVibes = Great_Vibes({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-great-vibes',
});

export default function SignNDASimpleClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDev = searchParams.get('dev') === 'true';

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

  const [signatureMode, setSignatureMode] = useState<'draw' | 'type' | 'upload'>('type');
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [typedSignature, setTypedSignature] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState("");
  const documentRef = useRef<HTMLDivElement>(null);

  // Load data from session storage
  useEffect(() => {
    const stored = sessionStorage.getItem('ndaSignData');
    if (stored) {
      const parsed = JSON.parse(stored);
      setNdaData(parsed);
      setPartyASignature(prev => ({ ...prev, name: parsed.partyAName || "" }));
      setTypedSignature(parsed.partyAName || "");
    }
  }, []);

  // Check if scrolled to bottom
  const handleScroll = () => {
    if (!documentRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = documentRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 50) {
      setHasScrolledToBottom(true);
    }
  };

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setSignatureImage(canvas.toDataURL());
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureImage(null);
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setSignatureImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Generate typed signature image
  useEffect(() => {
    if (signatureMode === 'type' && typedSignature) {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = '48px Great Vibes';
      ctx.fillStyle = '#000';
      ctx.textBaseline = 'middle';
      ctx.fillText(typedSignature, 20, 50);

      setSignatureImage(canvas.toDataURL());
    }
  }, [typedSignature, signatureMode]);

  // Submit signature
  const handleSubmit = async () => {
    if (!ndaData) {
      setErrorMessage("NDA data not found");
      return;
    }

    if (!hasScrolledToBottom) {
      setErrorMessage("Please read the entire document before signing");
      return;
    }

    if (!signatureImage) {
      setErrorMessage("Please provide a signature");
      return;
    }

    if (!partyASignature.name || !partyASignature.title) {
      setErrorMessage("Please fill in all required fields");
      return;
    }

    setSubmitStatus('submitting');
    setErrorMessage("");

    try {
      const response = await fetch('/api/ndas/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draftId: ndaData.draftId,
          signerEmail: ndaData.partyAEmail,
          signerName: partyASignature.name,
          signerTitle: partyASignature.title,
          signatureImage: signatureImage,
          signatureDate: partyASignature.date,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit signature');
      }

      setSubmitStatus('success');
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error) {
      setSubmitStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to submit signature');
    }
  };

  if (!ndaData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No NDA Data Found</h2>
          <p className="text-gray-600 mb-6">Please return to the NDA creation page.</p>
          <button
            onClick={() => router.push('/fillndahtml')}
            className="px-6 py-3 bg-[var(--teal-600)] text-white rounded-xl font-bold hover:bg-[var(--teal-700)] transition-all"
          >
            Go to NDA Creation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicToolbar />

      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sign NDA</h1>
          <p className="text-gray-600">Review and sign your non-disclosure agreement</p>
        </div>

        <div className="flex gap-6 items-start">
          {/* Signature Section - 35% width on LEFT */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col" style={{ width: '35%', minWidth: '350px' }}>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Your Signature</h2>

            {/* Form Fields */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  value={partyASignature.name}
                  onChange={(e) => setPartyASignature(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--teal-600)] focus:border-transparent"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
                <input
                  type="text"
                  value={partyASignature.title}
                  onChange={(e) => setPartyASignature(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--teal-600)] focus:border-transparent"
                  placeholder="Your title"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={partyASignature.date}
                  onChange={(e) => setPartyASignature(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--teal-600)] focus:border-transparent"
                />
              </div>
            </div>

            {/* Signature Mode Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200">
              <button
                onClick={() => setSignatureMode('type')}
                className={`px-4 py-2 font-semibold transition-all ${signatureMode === 'type'
                  ? 'text-[var(--teal-600)] border-b-2 border-[var(--teal-600)]'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Type
              </button>
              <button
                onClick={() => setSignatureMode('draw')}
                className={`px-4 py-2 font-semibold transition-all ${signatureMode === 'draw'
                  ? 'text-[var(--teal-600)] border-b-2 border-[var(--teal-600)]'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Draw
              </button>
              <button
                onClick={() => setSignatureMode('upload')}
                className={`px-4 py-2 font-semibold transition-all ${signatureMode === 'upload'
                  ? 'text-[var(--teal-600)] border-b-2 border-[var(--teal-600)]'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Upload
              </button>
            </div>

            {/* Signature Capture Area */}
            <div className="mb-6">
              {signatureMode === 'type' && (
                <div>
                  <input
                    type="text"
                    value={typedSignature}
                    onChange={(e) => setTypedSignature(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl mb-4"
                    placeholder="Type your name"
                  />
                  {typedSignature && (
                    <div className="p-6 border-2 border-gray-300 rounded-xl bg-white">
                      <p className={`${greatVibes.className} text-5xl text-center`}>{typedSignature}</p>
                    </div>
                  )}
                </div>
              )}

              {signatureMode === 'draw' && (
                <div>
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={150}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    className="w-full border-2 border-gray-300 rounded-xl cursor-crosshair bg-white"
                  />
                  <button
                    onClick={clearCanvas}
                    className="mt-2 text-sm text-gray-600 hover:text-gray-900 underline"
                  >
                    Clear
                  </button>
                </div>
              )}

              {signatureMode === 'upload' && (
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="w-full p-3 border border-gray-300 rounded-xl"
                  />
                  {signatureImage && (
                    <div className="mt-4 p-4 border-2 border-gray-300 rounded-xl bg-white">
                      <img src={signatureImage} alt="Signature" className="max-h-32 mx-auto" />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm">
                {errorMessage}
              </div>
            )}

            {/* Success Message */}
            {submitStatus === 'success' && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm">
                ✓ Signature submitted successfully! Redirecting...
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 mt-auto">
              <button
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitStatus === 'submitting' || !hasScrolledToBottom}
                className="flex-1 px-6 py-3 bg-[var(--teal-600)] text-white rounded-xl font-bold hover:bg-[var(--teal-700)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {submitStatus === 'submitting' ? 'Submitting...' : 'Submit Signature'}
              </button>
            </div>
          </div>

          {/* Document Preview - 60% width on RIGHT */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col" style={{ width: '60%' }}>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Document Review</h2>

            {!hasScrolledToBottom && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
                ⚠️ Please scroll to the bottom of the document to continue
              </div>
            )}

            <div
              ref={documentRef}
              onScroll={handleScroll}
              className="h-[750px] overflow-y-auto border border-gray-300 rounded-lg p-6 bg-white"
              dangerouslySetInnerHTML={{ __html: ndaData.htmlContent }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
