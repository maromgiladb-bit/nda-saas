"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDebouncedPreview } from "@/hooks/useDebouncedPreview";
import { sanitizeForHtml } from "@/lib/sanitize";

// Field state types
type FieldState = "readonly" | "editable" | "pending_suggestion";

interface FieldStates {
    [key: string]: FieldState;
}

interface Suggestion {
    oldValue: string;
    newValue: string;
    suggestedBy: "party_a" | "party_b";
}

interface Suggestions {
    [key: string]: Suggestion;
}

interface FormValues {
    [key: string]: string | boolean;
}

interface SummaryStats {
    fieldsToFill: number;
    suggestionsToReview: number;
    pendingSuggestions: number;
}

interface FillNDAPublicClientProps {
    signerId: string;
    signerEmail: string;
    signerName: string;
    ndaTitle: string;
    formData: FormValues;
    templateId: string;
    pendingInputFields: string[];
    fieldStates: FieldStates;
    incomingSuggestions: Suggestions;
    initialHtml: string;
    draftId: string;
}

// Field labels for display
const FIELD_LABELS: Record<string, string> = {
    party_a_name: "Party A Company Name",
    party_a_address: "Party A Address",
    party_a_phone: "Party A Phone",
    party_a_signatory_name: "Party A Signatory Name",
    party_a_title: "Party A Signatory Title",
    party_a_email: "Party A Email",
    party_b_name: "Party B Company Name",
    party_b_address: "Party B Address",
    party_b_phone: "Party B Phone",
    party_b_signatory_name: "Party B Signatory Name",
    party_b_title: "Party B Signatory Title",
    party_b_email: "Party B Email",
    effective_date: "Effective Date",
    term_months: "Agreement Term (months)",
    confidentiality_period_months: "Confidentiality Period (months)",
    governing_law: "Governing Law",
};

// All form fields
const ALL_FIELDS = [
    "party_a_name", "party_a_address", "party_a_phone",
    "party_a_signatory_name", "party_a_title", "party_a_email",
    "party_b_name", "party_b_address", "party_b_phone",
    "party_b_signatory_name", "party_b_title", "party_b_email",
];

export default function FillNDAPublicClient({
    signerId,
    signerEmail,
    signerName,
    ndaTitle,
    formData: initialFormData,
    templateId,
    pendingInputFields,
    fieldStates: initialFieldStates,
    incomingSuggestions,
    initialHtml,
    draftId,
}: FillNDAPublicClientProps) {
    const router = useRouter();

    // Form values - starts with data from server
    const [formValues, setFormValues] = useState<FormValues>(initialFormData);

    // My suggested changes (field -> new value)
    const [mySuggestions, setMySuggestions] = useState<Record<string, string>>({});

    // Which fields are showing the suggest-change input
    const [showingSuggestionFor, setShowingSuggestionFor] = useState<Set<string>>(new Set());

    // Responses to incoming suggestions (accept/reject/counter)
    const [suggestionResponses, setSuggestionResponses] = useState<Record<string, "accepted" | "rejected" | "countered">>({});

    // Counter values for rejected+countered suggestions
    const [counterValues, setCounterValues] = useState<Record<string, string>>({});

    // UI State
    const [showLivePreview, setShowLivePreview] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Compute summary stats
    const summaryStats: SummaryStats = {
        fieldsToFill: pendingInputFields.length,
        suggestionsToReview: Object.keys(incomingSuggestions).length,
        pendingSuggestions: Object.keys(mySuggestions).filter(k => mySuggestions[k]).length,
    };

    // Prepare template data for preview
    const templateData = {
        ...formValues,
        templateId,
        // Apply my suggestions for preview
        ...Object.fromEntries(
            Object.entries(mySuggestions).filter(([, v]) => v).map(([k, v]) => [k, sanitizeForHtml(v)])
        ),
    };

    // Debounced preview
    const { data: previewData, loading: previewLoading } = useDebouncedPreview(
        "/api/ndas/preview-html",
        templateData,
        500
    );
    const previewHtml = previewData?.html || initialHtml;

    // Get field state
    const getFieldState = (field: string): FieldState => {
        // If there's an incoming suggestion for this field
        if (incomingSuggestions[field]) return "pending_suggestion";
        // If it's in pending input fields, it's editable
        if (pendingInputFields.includes(field)) return "editable";
        // Otherwise readonly
        return initialFieldStates[field] || "readonly";
    };

    // Handle suggest change toggle
    const toggleSuggestion = (field: string) => {
        setShowingSuggestionFor(prev => {
            const next = new Set(prev);
            if (next.has(field)) {
                next.delete(field);
                // Clear the suggestion if closing
                setMySuggestions(s => ({ ...s, [field]: "" }));
            } else {
                next.add(field);
            }
            return next;
        });
    };

    // Handle accepting incoming suggestion
    const acceptSuggestion = (field: string) => {
        const suggestion = incomingSuggestions[field];
        if (suggestion) {
            setFormValues(prev => ({ ...prev, [field]: suggestion.newValue }));
            setSuggestionResponses(prev => ({ ...prev, [field]: "accepted" }));
        }
    };

    // Handle rejecting incoming suggestion
    const rejectSuggestion = (field: string) => {
        setSuggestionResponses(prev => ({ ...prev, [field]: "rejected" }));
    };

    // Handle counter-proposing
    const counterSuggestion = (field: string, value: string) => {
        setCounterValues(prev => ({ ...prev, [field]: value }));
        setSuggestionResponses(prev => ({ ...prev, [field]: "countered" }));
    };

    // Check if form is complete
    const isComplete = pendingInputFields.every(
        field => (formValues[field] as string)?.trim()
    );

    // Handle submit
    const handleSubmit = async () => {
        if (!isComplete && pendingInputFields.length > 0) {
            setError("Please fill in all required fields.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // Collect filled fields
            const filledFields: Record<string, string> = {};
            for (const field of pendingInputFields) {
                filledFields[field] = formValues[field] as string;
            }

            // Collect suggested changes
            const suggestedChanges: Record<string, string> = {};
            for (const [field, value] of Object.entries(mySuggestions)) {
                if (value?.trim()) {
                    suggestedChanges[field] = value;
                }
            }

            // Collect suggestion responses
            const responses: Record<string, { action: string; counterValue?: string }> = {};
            for (const [field, action] of Object.entries(suggestionResponses)) {
                responses[field] = { action };
                if (action === "countered") {
                    responses[field].counterValue = counterValues[field];
                }
            }

            const response = await fetch("/api/ndas/submit-input", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    signerId,
                    draftId,
                    filledFields,
                    suggestedChanges: Object.keys(suggestedChanges).length > 0 ? suggestedChanges : undefined,
                    suggestionResponses: Object.keys(responses).length > 0 ? responses : undefined,
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

    // Render field based on state
    const renderField = (field: string) => {
        const state = getFieldState(field);
        const value = formValues[field] as string || "";
        const label = FIELD_LABELS[field] || field;
        const isTextarea = field.includes("address");
        const incoming = incomingSuggestions[field];

        return (
            <div key={field} className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                    {state === "editable" && (
                        <span className="ml-2 text-orange-500 text-xs font-normal">
                            ⏳ Waiting for your input
                        </span>
                    )}
                </label>

                {/* Pending suggestion - yellow highlight with accept/reject */}
                {state === "pending_suggestion" && incoming && !suggestionResponses[field] && (
                    <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 mb-2">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-yellow-600 text-lg">💬</span>
                            <span className="font-medium text-yellow-800">Change Suggested</span>
                        </div>
                        <div className="mb-3">
                            <p className="text-sm text-gray-600">
                                <span className="line-through">{incoming.oldValue || "(empty)"}</span>
                                {" → "}
                                <span className="font-semibold text-yellow-700">{incoming.newValue}</span>
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => acceptSuggestion(field)}
                                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium text-sm"
                            >
                                ✓ Accept
                            </button>
                            <button
                                onClick={() => rejectSuggestion(field)}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium text-sm"
                            >
                                ✗ Reject
                            </button>
                            <button
                                onClick={() => setShowingSuggestionFor(prev => new Set([...prev, field]))}
                                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium text-sm"
                            >
                                ↩ Counter
                            </button>
                        </div>
                        {/* Counter input */}
                        {showingSuggestionFor.has(field) && (
                            <div className="mt-3">
                                <input
                                    type="text"
                                    value={counterValues[field] || ""}
                                    onChange={(e) => setCounterValues(prev => ({ ...prev, [field]: e.target.value }))}
                                    placeholder="Your counter-proposal..."
                                    className="w-full p-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                />
                                <button
                                    onClick={() => counterSuggestion(field, counterValues[field])}
                                    className="mt-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium text-sm"
                                >
                                    Submit Counter
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Response shown */}
                {suggestionResponses[field] && (
                    <div className={`px-3 py-2 rounded-lg mb-2 text-sm ${suggestionResponses[field] === "accepted" ? "bg-green-100 text-green-700" :
                            suggestionResponses[field] === "rejected" ? "bg-red-100 text-red-700" :
                                "bg-orange-100 text-orange-700"
                        }`}>
                        {suggestionResponses[field] === "accepted" && "✓ Accepted"}
                        {suggestionResponses[field] === "rejected" && "✗ Rejected"}
                        {suggestionResponses[field] === "countered" && `↩ Counter: ${counterValues[field]}`}
                    </div>
                )}

                {/* Editable field */}
                {state === "editable" && (
                    isTextarea ? (
                        <textarea
                            value={value}
                            onChange={(e) => setFormValues(prev => ({ ...prev, [field]: e.target.value }))}
                            className="w-full p-3 border-2 border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-orange-50"
                            rows={3}
                            placeholder={`Please enter ${label.toLowerCase()}`}
                        />
                    ) : (
                        <input
                            type={field.includes("email") ? "email" : field.includes("phone") ? "tel" : "text"}
                            value={value}
                            onChange={(e) => setFormValues(prev => ({ ...prev, [field]: e.target.value }))}
                            className="w-full p-3 border-2 border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-orange-50"
                            placeholder={`Please enter ${label.toLowerCase()}`}
                        />
                    )
                )}

                {/* Readonly field with suggest change option */}
                {state === "readonly" && !suggestionResponses[field] && (
                    <>
                        <div className="flex items-center gap-2">
                            {isTextarea ? (
                                <textarea
                                    value={value}
                                    disabled
                                    className="flex-1 p-3 border border-gray-200 rounded-lg bg-gray-100 text-gray-600"
                                    rows={2}
                                />
                            ) : (
                                <input
                                    type="text"
                                    value={value}
                                    disabled
                                    className="flex-1 p-3 border border-gray-200 rounded-lg bg-gray-100 text-gray-600"
                                />
                            )}
                            <button
                                onClick={() => toggleSuggestion(field)}
                                className={`px-3 py-2 rounded-lg font-medium text-sm whitespace-nowrap ${showingSuggestionFor.has(field)
                                        ? "bg-gray-500 text-white"
                                        : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                                    }`}
                            >
                                {showingSuggestionFor.has(field) ? "Cancel" : "✏️ Suggest Change"}
                            </button>
                        </div>

                        {/* Inline suggestion input */}
                        {showingSuggestionFor.has(field) && (
                            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <label className="block text-sm text-blue-700 mb-1">Your suggested value:</label>
                                {isTextarea ? (
                                    <textarea
                                        value={mySuggestions[field] || ""}
                                        onChange={(e) => setMySuggestions(prev => ({ ...prev, [field]: e.target.value }))}
                                        className="w-full p-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        rows={2}
                                        placeholder={`Suggest a new value for ${label.toLowerCase()}`}
                                    />
                                ) : (
                                    <input
                                        type="text"
                                        value={mySuggestions[field] || ""}
                                        onChange={(e) => setMySuggestions(prev => ({ ...prev, [field]: e.target.value }))}
                                        className="w-full p-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder={`Suggest a new value for ${label.toLowerCase()}`}
                                    />
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        );
    };

    // Success screen
    if (submitSuccess) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div className="text-6xl mb-4">✓</div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Submitted Successfully!
                    </h1>
                    <p className="text-gray-600">
                        Your information has been submitted. The other party will review and you'll be notified of next steps.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">📄</span>
                        <div>
                            <h1 className="font-semibold text-gray-900">{ndaTitle}</h1>
                            <p className="text-sm text-gray-500">Review and complete this agreement</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowLivePreview(!showLivePreview)}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition flex items-center gap-2"
                    >
                        {showLivePreview ? "Hide Preview" : "Show Preview"}
                    </button>
                </div>
            </header>

            {/* Summary Banner */}
            {(summaryStats.fieldsToFill > 0 || summaryStats.suggestionsToReview > 0) && (
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4">
                    <div className="max-w-7xl mx-auto flex items-center gap-6 text-white">
                        {summaryStats.fieldsToFill > 0 && (
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">📝</span>
                                <span><strong>{summaryStats.fieldsToFill}</strong> fields waiting for your input</span>
                            </div>
                        )}
                        {summaryStats.suggestionsToReview > 0 && (
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">💬</span>
                                <span><strong>{summaryStats.suggestionsToReview}</strong> changes to review</span>
                            </div>
                        )}
                        {summaryStats.pendingSuggestions > 0 && (
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">⏳</span>
                                <span><strong>{summaryStats.pendingSuggestions}</strong> suggestions you're making</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="flex h-[calc(100vh-140px)]">
                {/* Form Side */}
                <div className={`transition-all duration-300 ${showLivePreview ? "w-full lg:w-1/2" : "w-full"} overflow-y-auto`}>
                    <div className="max-w-2xl mx-auto p-6">

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                                {error}
                            </div>
                        )}

                        {/* Party A Section */}
                        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <span className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center text-teal-600">A</span>
                                Party A Information
                            </h2>
                            {["party_a_name", "party_a_address", "party_a_phone", "party_a_signatory_name", "party_a_title", "party_a_email"].map(renderField)}
                        </div>

                        {/* Party B Section */}
                        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <span className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">B</span>
                                Party B Information (You)
                            </h2>
                            {["party_b_name", "party_b_address", "party_b_phone", "party_b_signatory_name", "party_b_title", "party_b_email"].map(renderField)}
                        </div>

                        {/* Submit Button */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting || (!isComplete && pendingInputFields.length > 0)}
                                className={`w-full py-4 px-6 rounded-lg font-semibold text-white text-lg transition-all ${isSubmitting || (!isComplete && pendingInputFields.length > 0)
                                        ? "bg-gray-400 cursor-not-allowed"
                                        : "bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-lg hover:shadow-xl"
                                    }`}
                            >
                                {isSubmitting ? "Submitting..." : "Submit & Send to Other Party"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Preview Side */}
                {showLivePreview && (
                    <div className="hidden lg:block w-1/2 bg-gray-100 border-l border-gray-200">
                        <div className="sticky top-0 h-full overflow-y-auto p-6">
                            <div className="bg-white rounded-xl shadow-lg overflow-hidden h-full">
                                <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">📄</span>
                                        <span className="font-medium text-gray-700">Live Preview</span>
                                    </div>
                                    {previewLoading && (
                                        <span className="text-sm text-gray-500">Updating...</span>
                                    )}
                                </div>
                                <iframe
                                    srcDoc={previewHtml}
                                    title="NDA Preview"
                                    className="w-full h-[calc(100%-50px)]"
                                    sandbox="allow-same-origin"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
