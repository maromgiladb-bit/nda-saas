'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Great_Vibes } from 'next/font/google';
import PublicToolbar from '@/components/PublicToolbar';

const greatVibes = Great_Vibes({
    weight: '400',
    subsets: ['latin'],
    variable: '--font-great-vibes',
});

interface SignNDAPublicClientProps {
    signerId: string;
    signerEmail: string;
    signerName: string;
    ndaTitle: string;
    formData: Record<string, unknown>;
}

export default function SignNDAPublicClient({
    signerId,
    signerEmail,
    signerName: initialName,
    ndaTitle,
    formData,
}: SignNDAPublicClientProps) {
    const router = useRouter();
    const [signature, setSignature] = useState({
        name: initialName,
        title: '',
        date: new Date().toISOString().split('T')[0],
    });

    const [signatureMode, setSignatureMode] = useState<'draw' | 'type' | 'upload'>('type');
    const [signatureImage, setSignatureImage] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [typedSignature, setTypedSignature] = useState(initialName);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

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
        ctx.stroke();
    };

    const stopDrawing = () => {
        if (isDrawing && canvasRef.current) {
            setSignatureImage(canvasRef.current.toDataURL());
        }
        setIsDrawing(false);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setSignatureImage(null);
    };

    // Typed signature
    const handleTypedChange = (value: string) => {
        setTypedSignature(value);
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = `48px ${greatVibes.style.fontFamily}`;
        ctx.fillStyle = 'black';
        ctx.fillText(value, 20, 60);

        setSignatureImage(canvas.toDataURL());
    };

    // Upload signature
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            setSignatureImage(event.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    // Submit signature
    const handleSubmit = async () => {
        if (!signature.name || !signature.title) {
            setError('Please fill in all required fields');
            return;
        }

        if (!signatureImage) {
            setError('Please provide a signature');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/ndas/sign-public', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    signerId,
                    signerName: signature.name,
                    signerTitle: signature.title,
                    signatureImage,
                    signatureDate: signature.date,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to submit signature');
            }

            setSuccess(true);
            setTimeout(() => {
                router.push('/');
            }, 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to submit signature');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div className="text-6xl mb-4">✓</div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Thank You!
                    </h1>
                    <p className="text-gray-600 mb-4">
                        Your signature has been submitted successfully.
                    </p>
                    <p className="text-sm text-gray-500">
                        Redirecting to homepage...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <PublicToolbar />

            <div className="max-w-4xl mx-auto p-8">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Sign NDA</h1>
                    <p className="text-gray-600 mb-6">{ndaTitle}</p>

                    {/* Signature Form */}
                    <div className="space-y-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Name *
                            </label>
                            <input
                                type="text"
                                value={signature.name}
                                onChange={(e) => setSignature({ ...signature, name: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600"
                                placeholder="Your full name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Title *
                            </label>
                            <input
                                type="text"
                                value={signature.title}
                                onChange={(e) => setSignature({ ...signature, title: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600"
                                placeholder="Your title"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date
                            </label>
                            <input
                                type="date"
                                value={signature.date}
                                onChange={(e) => setSignature({ ...signature, date: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600"
                            />
                        </div>
                    </div>

                    {/* Signature Mode Tabs */}
                    <div className="flex gap-2 mb-4">
                        <button
                            onClick={() => setSignatureMode('type')}
                            className={`px-4 py-2 rounded-lg font-medium ${signatureMode === 'type'
                                    ? 'bg-teal-600 text-white'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                        >
                            Type
                        </button>
                        <button
                            onClick={() => setSignatureMode('draw')}
                            className={`px-4 py-2 rounded-lg font-medium ${signatureMode === 'draw'
                                    ? 'bg-teal-600 text-white'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                        >
                            Draw
                        </button>
                        <button
                            onClick={() => setSignatureMode('upload')}
                            className={`px-4 py-2 rounded-lg font-medium ${signatureMode === 'upload'
                                    ? 'bg-teal-600 text-white'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                        >
                            Upload
                        </button>
                    </div>

                    {/* Signature Input */}
                    {signatureMode === 'type' && (
                        <div className="mb-6">
                            <input
                                type="text"
                                value={typedSignature}
                                onChange={(e) => handleTypedChange(e.target.value)}
                                className={`w-full px-4 py-3 text-3xl border-2 border-gray-300 rounded-lg ${greatVibes.className}`}
                                placeholder="Your signature"
                            />
                        </div>
                    )}

                    {signatureMode === 'draw' && (
                        <div className="mb-6">
                            <canvas
                                ref={canvasRef}
                                width={600}
                                height={150}
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                                className="w-full border-2 border-gray-300 rounded-lg cursor-crosshair bg-white"
                            />
                            <button
                                onClick={clearCanvas}
                                className="mt-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                            >
                                Clear
                            </button>
                        </div>
                    )}

                    {signatureMode === 'upload' && (
                        <div className="mb-6">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg"
                            />
                            {signatureImage && (
                                <img
                                    src={signatureImage}
                                    alt="Signature"
                                    className="mt-4 max-h-32 border rounded"
                                />
                            )}
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
                            {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full px-6 py-3 bg-teal-600 text-white rounded-lg font-bold hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {loading ? 'Submitting...' : 'Submit Signature'}
                    </button>
                </div>
            </div>
        </div>
    );
}
