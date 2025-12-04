"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Great_Vibes } from 'next/font/google';

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

  // Load data from session storage
  useEffect(() => {
    const stored = sessionStorage.getItem('ndaSignData');
    if (stored) {
      const parsed = JSON.parse(stored);
      setNdaData(parsed);
      setPartyASignature(prev => ({ ...prev, name: parsed.partyAName || "" }));
    }
  }, []);

  // Simple sign page content
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Sign NDA</h1>
        {isDev && (
          <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 rounded">
            Development Mode
          </div>
        )}
        <div className="bg-white rounded-lg shadow p-6">
          <p>Signature functionality coming soon...</p>
        </div>
      </div>
    </div>
  );
}
