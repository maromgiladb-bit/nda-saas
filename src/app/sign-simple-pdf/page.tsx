"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export const dynamic = 'force-dynamic';
import { Cedarville_Cursive } from 'next/font/google';
import PrivateToolbar from "@/components/PrivateToolbar";

const cedarvilleCursive = Cedarville_Cursive({
    weight: '400',
    subsets: ['latin'],
    variable: '--font-cedarville-cursive',
});

export default function SignSimplePDFPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isDev = searchParams.get('dev') === 'true' || process.env.NODE_ENV === 'development';

    // --- State Management ---
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
    const [generatingPdf, setGeneratingPdf] = useState(false);
    const [pdfUrl, setPdfUrl] = useState<string>("");

    // --- Logic & Effects ---

    // Load Data
    useEffect(() => {
        const data = sessionStorage.getItem('ndaSignData');
        if (data) {
            const parsed = JSON.parse(data);
            setNdaData(parsed);
            setPartyASignature(prev => ({ ...prev, name: parsed.partyAName || "" }));
        } else if (!isDev) {
            router.push('/fillndahtml');
        }
    }, [router, isDev]);

    // Generate PDF when data loads
    useEffect(() => {
        if (ndaData?.htmlContent) {
            generatePdfPreview();
        }
    }, [ndaData?.htmlContent]);

    const generatePdfPreview = async () => {
        if (!ndaData?.htmlContent) return;

        setGeneratingPdf(true);
        try {
            const response = await fetch('/api/html-to-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ htmlContent: ndaData.htmlContent }),
            });

            if (!response.ok) throw new Error('Failed to generate PDF');

            const data = await response.json();
            setPdfUrl(data.fileUrl); // This is a data URL
        } catch (error) {
            console.error('PDF generation failed:', error);
            alert('Failed to generate PDF preview');
        } finally {
            setGeneratingPdf(false);
        }
    };

    const loadExampleData = async () => {
        setLoading(true);
        try {
            const dummyValues = {
                templateId: "professional_mutual_nda_v1",
                party_1_name: "Acme Corp",
                party_1_address: "123 Tech Blvd",
                party_1_signatory_name: "Alice Smith",
                party_1_signatory_title: "CEO",
                party_1_phone: "555-0101",
                party_2_name: "Beta Inc",
                party_2_address: "456 Innovation Way",
                party_2_signatory_name: "Bob Jones",
                party_2_signatory_title: "CTO",
                party_2_phone: "555-0202",
                effective_date_long: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                governing_law_full: "State of California",
                term_years_number: 2,
                term_years_words: "two",
                purpose: "evaluating a potential business relationship",
                information_scope_text: "All information and materials",
                ip_ownership: "Remains with disclosing party",
                additional_terms: "None",
            };

            const res = await fetch("/api/ndas/preview-html", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dummyValues),
            });

            if (!res.ok) throw new Error("Failed to load example template");
            const data = await res.json();

            setNdaData({
                draftId: "dev-test-id",
                values: dummyValues as any,
                htmlContent: data.html,
                partyAEmail: "alice@acme.com",
                partyAName: "Alice Smith",
                partyBEmail: "bob@beta.com",
                partyBName: "Bob Jones",
            });
            setPartyASignature(prev => ({ ...prev, name: "Alice Smith" }));
        } catch (error) {
            console.error("Failed to load example data:", error);
            alert("Failed to load example data");
        } finally {
            setLoading(false);
        }
    };

    // Canvas Drawing Logic
    const getCoordinates = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
        const rect = canvas.getBoundingClientRect();
        if ('touches' in e) {
            return {
                offsetX: e.touches[0].clientX - rect.left,
                offsetY: e.touches[0].clientY - rect.top
            };
        }
        return {
            offsetX: (e as React.MouseEvent).clientX - rect.left,
            offsetY: (e as React.MouseEvent).clientY - rect.top
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'black';
        ctx.beginPath();
        const { offsetX, offsetY } = getCoordinates(e, canvas);
        ctx.moveTo(offsetX, offsetY);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const { offsetX, offsetY } = getCoordinates(e, canvas);
        ctx.lineTo(offsetX, offsetY);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        const canvas = canvasRef.current;
        if (canvas) setSignatureImage(canvas.toDataURL());
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx?.clearRect(0, 0, canvas.width, canvas.height);
            setSignatureImage(null);
        }
    };

    // Upload Logic
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (evt) => setSignatureImage(evt.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    // Type Logic
    useEffect(() => {
        if (signatureMode === 'type' && typedSignature) {
            const canvas = document.createElement('canvas');
            canvas.width = 600;
            canvas.height = 150;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.font = "60px cursive";
                ctx.fillStyle = "black";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(typedSignature, canvas.width / 2, canvas.height / 2);
                setSignatureImage(canvas.toDataURL());
            }
        } else if (signatureMode === 'type' && !typedSignature) {
            setSignatureImage(null);
        }
    }, [typedSignature, signatureMode]);

    // Submit Logic
    const handleSign = async () => {
        if (!partyASignature.name.trim()) {
            alert("Please enter your name");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch("/api/sign-nda-manual", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ndaId: ndaData!.draftId,
                    htmlContent: ndaData!.htmlContent,
                    partyASignature: { ...partyASignature, signatureImage },
                    partyBSignature: { name: ndaData!.partyBName, title: "", date: "" },
                }),
            });

            if (!response.ok) throw new Error("Failed to save signature");
            await response.json();
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
            <div className="min-h-screen bg-gray-50 flex items-center justify-center flex-col gap-4">
                <PrivateToolbar />
                {isDev && (
                    <div className="text-center mt-20">
                        <p className="mb-4 text-gray-600">Development Mode Active</p>
                        <button onClick={loadExampleData} disabled={loading} className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 font-bold shadow-lg">
                            {loading ? "Loading..." : "Load Example Data"}
                        </button>
                    </div>
                )}
                {!isDev && <p className="text-gray-600 mt-20">Loading...</p>}
            </div>
        );
    }

    // --- Render: PDF Preview + Signature Sidebar Layout ---
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">

            {/* Toolbar */}
            <PrivateToolbar />

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">

                {/* LEFT: PDF Preview (~60%) */}
                <div className="w-[60%] bg-white border-r border-gray-200 overflow-y-auto">
                    <div className="sticky top-0 bg-gray-50 border-b border-gray-200 px-6 py-4 z-10">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-gray-900">PDF Preview</h3>
                                <p className="text-xs text-gray-600">Review before signing</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-semibold">PDF</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-gray-100">
                        {generatingPdf ? (
                            <div className="text-center py-20">
                                <svg className="animate-spin h-12 w-12 mx-auto mb-4 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <p className="text-sm text-gray-600">Generating PDF...</p>
                            </div>
                        ) : pdfUrl ? (
                            <div className="bg-white rounded-lg shadow-xl border border-gray-300 overflow-hidden">
                                <iframe
                                    src={pdfUrl}
                                    className="w-full border-0"
                                    style={{ height: '1000px' }}
                                    title="PDF Preview"
                                />
                            </div>
                        ) : (
                            <div className="text-center py-20 text-gray-400">
                                <svg className="w-20 h-20 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                <p className="text-sm">No PDF available</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT: Signature Tools (~40%) */}
                <div className="w-[40%] bg-gray-50 overflow-y-auto">
                    <div className="p-8">

                        {/* Document Summary */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Document Summary</h2>

                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Agreement Type</p>
                                    <p className="text-sm text-gray-900 font-medium">Mutual Non-Disclosure Agreement</p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Party A</p>
                                        <p className="text-sm text-gray-900 font-medium truncate">{ndaData.partyAName}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Party B</p>
                                        <p className="text-sm text-gray-900 font-medium truncate">{ndaData.partyBName}</p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Your Role</p>
                                    <div className="flex items-center gap-2 bg-teal-50 border border-teal-100 rounded-lg px-3 py-2">
                                        <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm">
                                            {ndaData.partyAName.charAt(0)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-gray-900 truncate">{ndaData.partyAName}</p>
                                            <p className="text-xs text-gray-600 truncate">{ndaData.partyAEmail}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Note about PDF signing */}
                        <div className="mb-6 bg-orange-50 border border-orange-200 rounded-xl p-4">
                            <div className="flex gap-3">
                                <svg className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                    <p className="text-sm font-semibold text-orange-900 mb-1">PDF Signing</p>
                                    <p className="text-xs text-orange-700">Create your signature below. It will be injected into the PDF when you complete signing.</p>
                                </div>
                            </div>
                        </div>

                        {/* Signature Options */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Create Your Signature</h2>

                            {/* Signature Mode Tabs */}
                            <div className="flex p-1 bg-gray-100 rounded-lg mb-4">
                                {(['type', 'draw', 'upload'] as const).map((mode) => (
                                    <button
                                        key={mode}
                                        className={`flex-1 py-2 text-xs font-bold rounded-md transition-all capitalize ${signatureMode === mode ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
                                        onClick={() => { setSignatureMode(mode); setSignatureImage(null); setTypedSignature(""); }}
                                    >
                                        {mode}
                                    </button>
                                ))}
                            </div>

                            {/* Signature Input Area */}
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 min-h-[200px]">

                                {/* TYPE Mode */}
                                {signatureMode === 'type' && (
                                    <div className="space-y-3">
                                        <input
                                            type="text"
                                            value={typedSignature}
                                            onChange={(e) => setTypedSignature(e.target.value)}
                                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all bg-white"
                                            placeholder="Type your full name..."
                                        />
                                        <div className="h-24 bg-white border border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                                            {typedSignature ? (
                                                <p className={`${cedarvilleCursive.className} text-4xl text-black`}>{typedSignature}</p>
                                            ) : (
                                                <span className="text-gray-400 text-xs font-medium">Signature preview</span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* DRAW Mode */}
                                {signatureMode === 'draw' && (
                                    <div className="relative bg-white rounded-lg border border-gray-300 touch-none">
                                        <canvas
                                            ref={canvasRef}
                                            width={400}
                                            height={160}
                                            className="w-full cursor-crosshair"
                                            onMouseDown={startDrawing}
                                            onMouseMove={draw}
                                            onMouseUp={stopDrawing}
                                            onMouseLeave={stopDrawing}
                                            onTouchStart={startDrawing}
                                            onTouchMove={draw}
                                            onTouchEnd={stopDrawing}
                                        />
                                        <button onClick={clearCanvas} className="absolute top-2 right-2 text-xs bg-white hover:bg-red-50 text-gray-600 hover:text-red-600 px-2 py-1 rounded border border-gray-300 shadow-sm transition-all font-medium">
                                            Clear
                                        </button>
                                        <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none">
                                            <p className="text-xs text-gray-400">Draw your signature</p>
                                        </div>
                                    </div>
                                )}

                                {/* UPLOAD Mode */}
                                {signatureMode === 'upload' && (
                                    <div>
                                        <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-white hover:border-teal-300 transition-all cursor-pointer relative group">
                                            <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                            <div className="flex flex-col items-center pointer-events-none">
                                                <svg className="w-12 h-12 text-gray-300 group-hover:text-teal-500 mb-2 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <span className="text-xs font-bold text-gray-700 mb-1">Upload signature image</span>
                                                <span className="text-xs text-gray-400">PNG, JPG up to 5MB</span>
                                            </div>
                                        </div>
                                        {signatureImage && (
                                            <div className="mt-3 border border-teal-200 rounded-lg p-3 bg-teal-50 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <img src={signatureImage} alt="Preview" className="h-10 w-auto object-contain border border-gray-200 bg-white p-1 rounded" />
                                                    <span className="text-sm text-teal-700 font-semibold">✓ Uploaded</span>
                                                </div>
                                                <button onClick={() => setSignatureImage(null)} className="text-gray-500 hover:text-red-500 p-1">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Confirm Details */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Confirm Details</h2>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Full Name</label>
                                    <input
                                        type="text"
                                        value={partyASignature.name}
                                        onChange={(e) => setPartyASignature({ ...partyASignature, name: e.target.value })}
                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition bg-white"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Title</label>
                                        <input
                                            type="text"
                                            value={partyASignature.title}
                                            onChange={(e) => setPartyASignature({ ...partyASignature, title: e.target.value })}
                                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition bg-white"
                                            placeholder="e.g. CEO"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Date</label>
                                        <input
                                            type="date"
                                            value={partyASignature.date}
                                            onChange={(e) => setPartyASignature({ ...partyASignature, date: e.target.value })}
                                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition bg-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sign Button */}
                        <button
                            onClick={handleSign}
                            disabled={loading || !partyASignature.name.trim() || !signatureImage}
                            className="w-full bg-teal-600 text-white px-6 py-4 rounded-xl hover:bg-teal-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Signing...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span>Complete Signature</span>
                                </>
                            )}
                        </button>

                        {/* Next Steps Info */}
                        <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4">
                            <div className="flex gap-3">
                                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                    <p className="text-sm font-semibold text-blue-900 mb-1">Next Steps</p>
                                    <p className="text-xs text-blue-700">Your signature will be added to the PDF and sent to {ndaData.partyBName} for their signature.</p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}
