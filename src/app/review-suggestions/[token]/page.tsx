"use client";
import React, { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import PublicToolbar from "@/components/PublicToolbar";

type FormValues = Record<string, string>;
type Suggestions = Record<string, string>;

export default function ReviewSuggestions({ params }: { params: Promise<{ token: string }> }) {
	const { token } = use(params);
	const router = useRouter();
	const [currentData, setCurrentData] = useState<FormValues>({});
	const [suggestions, setSuggestions] = useState<Suggestions>({});
	const [partyBInfo, setPartyBInfo] = useState({ name: "", email: "" });
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [saving, setSaving] = useState(false);
	const [draftId, setDraftId] = useState<string | null>(null);
	const [acceptedFields, setAcceptedFields] = useState<Set<string>>(new Set());

	const loadSuggestions = useCallback(async () => {
		try {
			setLoading(true);
			const res = await fetch(`/api/ndas/review-suggestions/${token}`);
			const data = await res.json();

			if (!res.ok) {
				setError(data.error || "Failed to load suggestions");
				return;
			}

			setCurrentData(data.currentData);
			setSuggestions(data.suggestions);
			setPartyBInfo({ name: data.party_b_name, email: data.party_b_email });
			setDraftId(data.draftId);
		} catch (err) {
			console.error("Error loading suggestions:", err);
			setError("Failed to load suggestions");
		} finally {
			setLoading(false);
		}
	}, [token]);

	useEffect(() => {
		loadSuggestions();
	}, [loadSuggestions]);

	const toggleAccept = (field: string) => {
		const newAccepted = new Set(acceptedFields);
		if (newAccepted.has(field)) {
			newAccepted.delete(field);
		} else {
			newAccepted.add(field);
		}
		setAcceptedFields(newAccepted);
	};

	const applyChangesAndSendBack = async () => {
		if (!draftId) return;

		try {
			setSaving(true);

			// Build updated data with accepted suggestions
			const updatedData = { ...currentData };
			acceptedFields.forEach((field) => {
				if (suggestions[field]) {
					updatedData[field] = suggestions[field];
				}
			});

			// Save changes
			const res = await fetch(`/api/ndas/review-suggestions/${token}/apply`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					updatedData,
					acceptedFields: Array.from(acceptedFields),
				}),
			});

			const data = await res.json();
			if (!res.ok) {
				setError(data.error || "Failed to apply changes");
				return;
			}

			alert(`Changes applied! An email has been sent to ${partyBInfo.name} to sign the updated NDA.`);
			router.push("/dashboard");
		} catch (err) {
			console.error("Error applying changes:", err);
			setError("Failed to apply changes");
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50">
				<PublicToolbar />
				<div className="flex items-center justify-center min-h-[80vh]">
					<div className="text-center">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
						<p className="mt-4 text-gray-600">Loading suggestions...</p>
					</div>
				</div>
			</div>
		);
	}

	if (error && !Object.keys(suggestions).length) {
		return (
			<div className="min-h-screen bg-gray-50">
				<PublicToolbar />
				<div className="flex items-center justify-center min-h-[80vh]">
					<div className="text-center">
						<svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						<h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid or Expired Link</h2>
						<p className="text-gray-600">{error}</p>
					</div>
				</div>
			</div>
		);
	}

	const suggestionFields = Object.keys(suggestions).filter(key => suggestions[key] && suggestions[key].trim());

	// Helper to get friendly field name and category
	const getFieldInfo = (field: string) => {
		const fieldMap: Record<string, { label: string; category: string; required: boolean }> = {
			docName: { label: "Purpose/Topic", category: "Document", required: true },
			effective_date: { label: "Effective Date", category: "Document", required: true },
			term_months: { label: "Term (months)", category: "Document", required: true },
			confidentiality_period_months: { label: "Confidentiality Period (months)", category: "Document", required: true },
			party_a_name: { label: "Name", category: "Party A", required: true },
			party_a_address: { label: "Address", category: "Party A", required: false },
			party_a_signatory_name: { label: "Signatory Name", category: "Party A", required: false },
			party_a_title: { label: "Title", category: "Party A", required: false },
			governing_law: { label: "Governing Law", category: "Terms", required: false },
			ip_ownership: { label: "IP Ownership Clause", category: "Terms", required: false },
			non_solicit: { label: "Non-Solicitation Clause", category: "Terms", required: false },
			exclusivity: { label: "Exclusivity Clause", category: "Terms", required: false },
		};
		return fieldMap[field] || { 
			label: field.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()), 
			category: "Other",
			required: false 
		};
	};

	// Group suggestions by category
	const groupedSuggestions = suggestionFields.reduce((acc, field) => {
		const info = getFieldInfo(field);
		if (!acc[info.category]) acc[info.category] = [];
		acc[info.category].push(field);
		return acc;
	}, {} as Record<string, string[]>);

	return (
		<div className="min-h-screen bg-gray-50">
			<PublicToolbar />

			<div className="max-w-5xl mx-auto px-4 py-8">
				{/* Header */}
				<div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-8 mb-6 text-white">
					<h1 className="text-3xl font-bold mb-2">
						Review Suggestions from {partyBInfo.name}
					</h1>
					<p className="text-blue-100">
						{partyBInfo.name} ({partyBInfo.email}) has suggested changes to your NDA. 
						Review each suggestion below and choose which ones to accept.
					</p>
				</div>

				{error && (
					<div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
						{error}
					</div>
				)}

				{/* Suggestions */}
				<div className="space-y-6 mb-6">
					{suggestionFields.length === 0 ? (
						<div className="bg-white rounded-lg shadow-sm p-8 text-center">
							<p className="text-gray-600">No suggestions found.</p>
						</div>
					) : (
						Object.entries(groupedSuggestions).map(([category, fields]) => (
							<div key={category} className="space-y-4">
								<h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
									<span className="inline-block w-1 h-6 bg-blue-600 rounded"></span>
									{category} Information
								</h2>
								{fields.map((field) => {
									const isAccepted = acceptedFields.has(field);
									const fieldInfo = getFieldInfo(field);

									return (
										<div
											key={field}
											className={`bg-white rounded-lg shadow-sm p-6 border-2 transition-all ${
												isAccepted ? "border-green-500 bg-green-50" : "border-gray-200"
											}`}
										>
											<div className="flex items-start justify-between mb-4">
												<div className="flex-1">
													<h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
														{fieldInfo.label}
														{fieldInfo.required && <span className="text-red-500 text-sm">*</span>}
														{!fieldInfo.required && <span className="text-xs text-gray-500">(optional)</span>}
													</h3>
													<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
														<div>
															<label className="block text-xs font-medium text-gray-500 mb-1">
																Current Value:
															</label>
															<div className="p-3 bg-gray-100 rounded border border-gray-300 text-sm min-h-[60px] whitespace-pre-wrap">
																{currentData[field] || <span className="text-gray-400 italic">Empty</span>}
															</div>
														</div>
														<div>
															<label className="block text-xs font-medium text-yellow-700 mb-1">
																💡 Suggested Value:
															</label>
															<div className="p-3 bg-yellow-50 rounded border border-yellow-300 text-sm font-medium min-h-[60px] whitespace-pre-wrap">
																{suggestions[field]}
															</div>
														</div>
													</div>
												</div>
											</div>

											<div className="flex items-center gap-3 mt-4">
												<button
													onClick={() => toggleAccept(field)}
													className={`px-6 py-2 rounded-lg font-medium transition-all ${
														isAccepted
															? "bg-green-600 text-white hover:bg-green-700"
															: "bg-gray-200 text-gray-700 hover:bg-gray-300"
													}`}
												>
													{isAccepted ? "✓ Accepted" : "Accept Suggestion"}
												</button>
												{isAccepted && (
													<span className="text-sm text-green-700 font-medium">
														This change will be applied
													</span>
												)}
											</div>
										</div>
									);
								})}
							</div>
						))
					)}
				</div>

				{/* Actions */}
				<div className="bg-white rounded-lg shadow-sm p-6">
					<div className="mb-4">
						<h3 className="text-lg font-semibold mb-2">Summary</h3>
						<p className="text-gray-600">
							You have accepted <strong>{acceptedFields.size}</strong> out of{" "}
							<strong>{suggestionFields.length}</strong> suggestions.
						</p>
					</div>

					<div className="flex flex-wrap gap-3">
						<button
							onClick={applyChangesAndSendBack}
							disabled={saving}
							className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:bg-gray-400 font-semibold flex items-center gap-2"
						>
							{saving ? (
								"Applying..."
							) : (
								<>
									✅ Apply Changes & Send Back to {partyBInfo.name}
								</>
							)}
						</button>
						<button
							onClick={() => router.push("/dashboard")}
							className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
						>
							Cancel
						</button>
					</div>

					<p className="mt-4 text-sm text-gray-600">
						After applying changes, {partyBInfo.name} will receive an email with the updated NDA 
						and can proceed to sign it.
					</p>
				</div>
			</div>
		</div>
	);
}
