"use client";

import React, { useState, useEffect } from "react";
import { useDebouncedPreview } from "@/hooks/useDebouncedPreview";
import { sanitizeForHtml } from "@/lib/sanitize";

interface FillNDAPublicClientProps {
    signerId: string;
    signerEmail: string;
    signerName: string;
    ndaTitle: string;
    formData: Record<string, unknown>;
    templateId: string;
    pendingInputFields: string[];
    initialHtml: string;
    draftId: string;
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

export default function FillNDAPublicClient({
    signerId,
    signerEmail,
    signerName,
    ndaTitle,
    formData: initialFormData,
    templateId,
    pendingInputFields,
    initialHtml,
    draftId,
}: FillNDAPublicClientProps) {
    const [formValues, setFormValues] = useState<Record<string, string>>({});
    const [suggestedChanges, setSuggestedChanges] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initialize form values from pending fields
    useEffect(() => {
        const values: Record<string, string> = {};
        for (const field of pendingInputFields) {
            values[field] = (initialFormData[field] as string) || "";
        }
        setFormValues(values);
    }, [pendingInputFields, initialFormData]);

    // Prepare template data for preview
    const templateData = {
        ...initialFormData,
        ...formValues,
        templateId,
        // Sanitize values for HTML
        ...Object.fromEntries(
            Object.entries(formValues).map(([k, v]) => [k, sanitizeForHtml(v)])
        ),
    };

    // Debounced preview
    const { data: previewData, loading: previewLoading } = useDebouncedPreview(
        "/api/ndas/preview-html",
        templateData,
        500
    );

    const previewHtml = previewData?.html || initialHtml;

    const setField = (field: string, value: string) => {
        setFormValues((prev) => ({ ...prev, [field]: value }));
    };

    const setSuggestedChange = (field: string, value: string) => {
        setSuggestedChanges((prev) => ({ ...prev, [field]: value }));
    };

    const isComplete = pendingInputFields.every(
        (field) => formValues[field]?.trim()
    );

    const handleSubmit = async () => {
        if (!isComplete) {
            setError("Please fill in all required fields.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch("/api/ndas/submit-input", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    signerId,
                    draftId,
                    filledFields: formValues,
                    suggestedChanges: Object.keys(suggestedChanges).length > 0 ? suggestedChanges : undefined,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to submit");
            }

            setSubmitSuccess(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitSuccess) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div className="text-6xl mb-4">✓</div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Information Submitted!
                    </h1>
                    <p className="text-gray-600">
                        Your information has been submitted successfully. The sender will
                        review and you'll receive a notification when the NDA is ready for
                        signature.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
            {/* Simple header with NDA title */}
            <header className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">📄</span>
                        <div>
                            <h1 className="font-semibold text-gray-900">{ndaTitle}</h1>
                            <p className="text-sm text-gray-500">Complete your information</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex flex-col lg:flex-row min-h-[calc(100vh-64px)]">
                {/* Left: Form */}
                <section className="w-full lg:w-1/2 p-6 lg:p-8 overflow-y-auto">
                    <div className="max-w-xl mx-auto">
                        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                Complete Your Information
                            </h1>
                            <p className="text-gray-600 mb-4">
                                Please fill in the fields below to complete this NDA:{" "}
                                <strong>{ndaTitle}</strong>
                            </p>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                <div className="flex items-center gap-2 text-blue-800">
                                    <span className="text-xl">📝</span>
                                    <span>
                                        <strong>{pendingInputFields.length}</strong> field
                                        {pendingInputFields.length > 1 ? "s" : ""} to complete
                                    </span>
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
                                    {error}
                                </div>
                            )}

                            {/* Required Fields */}
                            <div className="space-y-6">
                                <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">
                                    Your Information (Party B)
                                </h2>

                                {pendingInputFields.map((field) => (
                                    <div key={field} className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            {FIELD_LABELS[field] || field}
                                            <span className="text-red-500 ml-1">*</span>
                                        </label>
                                        {field === "party_b_address" ? (
                                            <textarea
                                                value={formValues[field] || ""}
                                                onChange={(e) => setField(field, e.target.value)}
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                rows={3}
                                                placeholder={`Enter your ${FIELD_LABELS[field]?.toLowerCase() || field}`}
                                            />
                                        ) : (
                                            <input
                                                type={field.includes("email") ? "email" : field.includes("phone") ? "tel" : "text"}
                                                value={formValues[field] || ""}
                                                onChange={(e) => setField(field, e.target.value)}
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder={`Enter your ${FIELD_LABELS[field]?.toLowerCase() || field}`}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Optional: Suggest Changes */}
                            <details className="mt-8">
                                <summary className="cursor-pointer text-gray-600 hover:text-gray-800 font-medium">
                                    💬 Want to suggest changes to other fields?
                                </summary>
                                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <p className="text-sm text-yellow-800 mb-4">
                                        If you'd like to suggest changes to any pre-filled fields,
                                        enter your suggestions below. The sender will review them.
                                    </p>
                                    <textarea
                                        value={suggestedChanges.general || ""}
                                        onChange={(e) =>
                                            setSuggestedChange("general", e.target.value)
                                        }
                                        className="w-full p-3 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                                        rows={4}
                                        placeholder="Describe any changes you'd like to suggest..."
                                    />
                                </div>
                            </details>

                            {/* Submit Button */}
                            <div className="mt-8">
                                <button
                                    onClick={handleSubmit}
                                    disabled={!isComplete || isSubmitting}
                                    className={`w-full py-4 px-6 rounded-lg font-semibold text-white text-lg transition-all ${isComplete && !isSubmitting
                                        ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl"
                                        : "bg-gray-400 cursor-not-allowed"
                                        }`}
                                >
                                    {isSubmitting ? "Submitting..." : "Submit Information"}
                                </button>
                                <p className="text-center text-sm text-gray-500 mt-3">
                                    Your information will be sent to the NDA owner for review
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Right: Preview */}
                <section className="hidden lg:block w-1/2 bg-gray-100 border-l border-gray-200">
                    <div className="sticky top-0 h-screen overflow-y-auto p-6">
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                            <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">📄</span>
                                    <span className="font-medium text-gray-700">
                                        Live Preview
                                    </span>
                                </div>
                                {previewLoading && (
                                    <span className="text-sm text-gray-500">Updating...</span>
                                )}
                            </div>
                            <iframe
                                srcDoc={previewHtml}
                                title="NDA Preview"
                                className="w-full h-[calc(100vh-150px)]"
                                sandbox="allow-same-origin"
                            />
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
