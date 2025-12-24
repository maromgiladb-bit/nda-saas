"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDebouncedPreview } from "@/hooks/useDebouncedPreview";

interface ReviewChangesClientProps {
    draftId: string;
    draftTitle: string;
    workflowState: string;
    formData: Record<string, unknown>;
    filledFields: Record<string, string>;
    suggestedChanges: Record<string, string>;
    submittedBy: string;
    previewHtml: string;
    templateId: string;
}

// Field labels for display
const FIELD_LABELS: Record<string, string> = {
    party_b_name: "Company/Party Name",
    party_b_address: "Address",
    party_b_phone: "Phone Number",
    party_b_signatory_name: "Signatory Name",
    party_b_title: "Signatory Title",
    party_b_email: "Email Address",
};

export default function ReviewChangesClient({
    draftId,
    draftTitle,
    workflowState,
    formData,
    filledFields,
    suggestedChanges,
    submittedBy,
    previewHtml,
    templateId,
}: ReviewChangesClientProps) {
    const router = useRouter();
    const [isApproving, setIsApproving] = useState(false);
    const [isRequestingChanges, setIsRequestingChanges] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState("");

    const hasSuggestions = Object.values(suggestedChanges).some(v => v?.trim());

    const handleApprove = async () => {
        setIsApproving(true);
        setError(null);

        try {
            const response = await fetch('/api/ndas/approve-changes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ draftId })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to approve');
            }

            // Redirect to fillndahtml to send for signature
            router.push(`/fillndahtml?draftId=${draftId}&action=send-for-signature`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsApproving(false);
        }
    };

    const handleRequestChanges = async () => {
        if (!message.trim()) {
            setError("Please enter a message describing the changes you'd like.");
            return;
        }

        setIsRequestingChanges(true);
        setError(null);

        try {
            const response = await fetch('/api/ndas/request-changes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ draftId, message })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to request changes');
            }

            router.push('/dashboard?message=changes-requested');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsRequestingChanges(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">📋</span>
                        <div>
                            <h1 className="font-semibold text-gray-900">Review Changes</h1>
                            <p className="text-sm text-gray-500">{draftTitle}</p>
                        </div>
                    </div>
                    <Link href="/dashboard">
                        <button className="px-4 py-2 text-gray-600 hover:text-gray-900">
                            ← Back to Dashboard
                        </button>
                    </Link>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left: Changes Summary */}
                    <div className="space-y-6">
                        {/* Info Card */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="text-2xl">📝</span>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">
                                        Submitted by {submittedBy}
                                    </h2>
                                    <p className="text-sm text-gray-500">
                                        Review the information provided below
                                    </p>
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-red-700">
                                    {error}
                                </div>
                            )}

                            {/* Filled Fields */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-gray-800 border-b pb-2">
                                    Fields Completed by Party B
                                </h3>
                                {Object.entries(filledFields).length > 0 ? (
                                    Object.entries(filledFields).map(([field, value]) => (
                                        <div key={field} className="flex justify-between items-start py-2 border-b border-gray-100">
                                            <span className="text-sm font-medium text-gray-600">
                                                {FIELD_LABELS[field] || field}
                                            </span>
                                            <span className="text-sm text-gray-900 text-right max-w-xs">
                                                {value || "(empty)"}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 italic">No fields were filled.</p>
                                )}
                            </div>

                            {/* Suggested Changes */}
                            {hasSuggestions && (
                                <div className="mt-6 space-y-4">
                                    <h3 className="font-semibold text-yellow-800 border-b border-yellow-200 pb-2 flex items-center gap-2">
                                        <span>💬</span> Suggested Changes
                                    </h3>
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                        {Object.entries(suggestedChanges).map(([key, value]) => (
                                            value?.trim() && (
                                                <div key={key} className="text-gray-800">
                                                    {value}
                                                </div>
                                            )
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Actions Card */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h3 className="font-semibold text-gray-800 mb-4">Your Decision</h3>

                            {!hasSuggestions ? (
                                <button
                                    onClick={handleApprove}
                                    disabled={isApproving}
                                    className="w-full py-4 px-6 rounded-lg font-semibold text-white text-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                                >
                                    {isApproving ? "Approving..." : "✓ Approve & Continue to Signature"}
                                </button>
                            ) : (
                                <div className="space-y-4">
                                    <button
                                        onClick={handleApprove}
                                        disabled={isApproving}
                                        className="w-full py-3 px-6 rounded-lg font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50"
                                    >
                                        {isApproving ? "Approving..." : "✓ Accept Changes & Continue"}
                                    </button>

                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-gray-200"></div>
                                        </div>
                                        <div className="relative flex justify-center text-sm">
                                            <span className="px-2 bg-white text-gray-500">or</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Request Additional Changes
                                        </label>
                                        <textarea
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                            rows={3}
                                            placeholder="Describe what changes you'd like Party B to make..."
                                        />
                                        <button
                                            onClick={handleRequestChanges}
                                            disabled={isRequestingChanges || !message.trim()}
                                            className="mt-2 w-full py-3 px-6 rounded-lg font-semibold text-orange-700 bg-orange-100 hover:bg-orange-200 transition-all disabled:opacity-50"
                                        >
                                            {isRequestingChanges ? "Sending..." : "← Request Changes from Party B"}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Preview */}
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                        <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">📄</span>
                                <span className="font-medium text-gray-700">NDA Preview</span>
                            </div>
                        </div>
                        <iframe
                            srcDoc={previewHtml}
                            title="NDA Preview"
                            className="w-full h-[700px]"
                            sandbox="allow-same-origin"
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}
