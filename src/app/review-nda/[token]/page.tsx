"use client";
import React, { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import PublicToolbar from "@/components/PublicToolbar";

type FormValues = {
	docName: string;
	effective_date: string;
	term_months: string;
	confidentiality_period_months: string;
	party_a_name: string;
	party_a_address: string;
	party_a_signatory_name: string;
	party_a_title: string;
	party_b_name: string;
	party_b_address: string;
	party_b_signatory_name: string;
	party_b_title: string;
	party_b_email: string;
	governing_law: string;
	ip_ownership: string;
	non_solicit: string;
	exclusivity: string;
};

export default function ReviewNDA({ params }: { params: Promise<{ token: string }> }) {
	const { token } = use(params);
	const router = useRouter();
	const [values, setValues] = useState<FormValues | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [saving, setSaving] = useState(false);
	const [templateId, setTemplateId] = useState<string>("mutual-nda-v3");
	const [draftId, setDraftId] = useState<string | null>(null);
	const [tokenScope, setTokenScope] = useState<string>("VIEW");
	const [signing, setSigning] = useState(false);
	const [signatureData, setSignatureData] = useState({
		party_b_signatory_name: "",
		signature_date: new Date().toISOString().slice(0, 10),
	});
	const [suggestions, setSuggestions] = useState<Record<string, string>>({});
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [sendingBack, setSendingBack] = useState(false);

	const loadDraftFromToken = useCallback(async () => {
		try {
			setLoading(true);
			const res = await fetch(`/api/ndas/review/${token}`);
			const data = await res.json();

			if (!res.ok) {
				setError(data.error || "Failed to load NDA");
				return;
			}

			setValues(data.formData);
			setTemplateId(data.templateId || "mutual-nda-v3");
			setDraftId(data.draftId);
			setTokenScope(data.scope || "VIEW");
			
			// Pre-fill signature name if Party B name exists
			if (data.formData.party_b_signatory_name) {
				setSignatureData(prev => ({
					...prev,
					party_b_signatory_name: data.formData.party_b_signatory_name
				}));
			}
		} catch (err) {
			console.error("Error loading draft:", err);
			setError("Failed to load NDA");
		} finally {
			setLoading(false);
		}
	}, [token]);

	useEffect(() => {
		loadDraftFromToken();
	}, [loadDraftFromToken]);

	const handleChange = (field: keyof FormValues, value: string) => {
		if (!values) return;
		setValues({ ...values, [field]: value });
	};

	const saveChanges = async () => {
		if (!values || !draftId) return;

		try {
			setSaving(true);
			const res = await fetch(`/api/ndas/review/${token}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ formData: values }),
			});

			const data = await res.json();
			if (!res.ok) {
				setError(data.error || "Failed to save changes");
				return;
			}

			alert("Changes saved successfully!");
		} catch (err) {
			console.error("Error saving:", err);
			setError("Failed to save changes");
		} finally {
			setSaving(false);
		}
	};

	const generatePreview = async () => {
		if (!values) return;

		try {
			const res = await fetch("/api/ndas/preview", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ ...values, templateId }),
			});

			const json = await res.json();
			if (!res.ok) {
				setError(json.error || "Preview failed");
				return;
			}

			// Open PDF in new tab
			const newWindow = window.open();
			if (newWindow) {
				newWindow.document.write(`
					<!DOCTYPE html>
					<html>
					<head>
						<title>NDA Preview</title>
						<style>
							body { margin: 0; padding: 0; }
							iframe { width: 100%; height: 100vh; border: none; }
						</style>
					</head>
					<body>
						<iframe src="${json.fileUrl}"></iframe>
					</body>
					</html>
				`);
				newWindow.document.close();
			}
		} catch (err) {
			console.error("Preview error:", err);
			setError("Failed to generate preview");
		}
	};

	const sendBackWithSuggestions = async () => {
		if (!values) return;

		// Check if there are any suggestions
		const hasSuggestions = Object.keys(suggestions).some(key => suggestions[key].trim());
		if (!hasSuggestions) {
			setError("Please add at least one suggestion before sending back");
			return;
		}

		try {
			setSendingBack(true);
			const res = await fetch(`/api/ndas/review/${token}/suggest`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ 
					suggestions,
					party_b_email: values.party_b_email,
					party_b_name: values.party_b_name,
				}),
			});

			const data = await res.json();
			if (!res.ok) {
				setError(data.error || "Failed to send suggestions");
				return;
			}

			alert("Your suggestions have been sent to Party A for review!");
			// Reload to show updated state
			loadDraftFromToken();
		} catch (err) {
			console.error("Error sending suggestions:", err);
			setError("Failed to send suggestions");
		} finally {
			setSendingBack(false);
		}
	};

	const signDocument = async () => {
		if (!signatureData.party_b_signatory_name.trim()) {
			setError("Please enter your name to sign");
			return;
		}

		try {
			setSigning(true);
			const res = await fetch(`/api/ndas/review/${token}/sign`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(signatureData),
			});

			const data = await res.json();
			if (!res.ok) {
				setError(data.error || "Failed to sign document");
				return;
			}

			alert("Document signed successfully! The owner will be notified.");
			// Reload to show signed state
			loadDraftFromToken();
		} catch (err) {
			console.error("Error signing:", err);
			setError("Failed to sign document");
		} finally {
			setSigning(false);
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50">
				<PublicToolbar />
				<div className="flex items-center justify-center min-h-[80vh]">
					<div className="text-center">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
						<p className="mt-4 text-gray-600">Loading NDA...</p>
					</div>
				</div>
			</div>
		);
	}

	if (error && !values) {
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

	if (!values) return null;

	const canEdit = tokenScope === "EDIT" || tokenScope === "REVIEW" || tokenScope === "SIGN";
	const canSign = tokenScope === "SIGN" || tokenScope === "REVIEW";

	return (
		<div className="min-h-screen bg-gray-50">
			<PublicToolbar />
			
			<div className="max-w-4xl mx-auto px-4 py-8">
				{/* Header */}
				<div className="bg-white rounded-lg shadow-sm p-6 mb-6">
					<h1 className="text-3xl font-bold text-gray-900 mb-2">
						Review & Sign NDA
					</h1>
					<p className="text-gray-600">
						You&apos;ve been invited to review and sign this Non-Disclosure Agreement.
						{canEdit && " You can edit your information below."}
					</p>
					{error && (
						<div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
							{error}
						</div>
					)}
				</div>

				{/* Document Info */}
				<div className="bg-white rounded-lg shadow-sm p-6 mb-6">
					<h2 className="text-xl font-semibold mb-4">Document Information</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Purpose/Topic <span className="text-red-500">*</span>
							</label>
							<input
								type="text"
								value={values.docName}
								disabled
								className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
							/>
							{showSuggestions && (
								<div className="mt-2">
									<label className="block text-xs font-medium text-yellow-700 mb-1">
										💡 Suggest a change:
									</label>
									<input
										type="text"
										value={suggestions.docName || ""}
										onChange={(e) => setSuggestions({ ...suggestions, docName: e.target.value })}
										placeholder="Suggest different purpose..."
										className="w-full px-3 py-2 border border-yellow-300 rounded-lg bg-yellow-50 text-sm"
									/>
								</div>
							)}
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Effective Date <span className="text-red-500">*</span>
							</label>
							<input
								type="date"
								value={values.effective_date}
								disabled
								className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
							/>
							{showSuggestions && (
								<div className="mt-2">
									<label className="block text-xs font-medium text-yellow-700 mb-1">
										💡 Suggest a change:
									</label>
									<input
										type="date"
										value={suggestions.effective_date || ""}
										onChange={(e) => setSuggestions({ ...suggestions, effective_date: e.target.value })}
										className="w-full px-3 py-2 border border-yellow-300 rounded-lg bg-yellow-50 text-sm"
									/>
								</div>
							)}
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Term (months) <span className="text-red-500">*</span>
							</label>
							<input
								type="number"
								value={values.term_months}
								disabled
								className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
							/>
							{showSuggestions && (
								<div className="mt-2">
									<label className="block text-xs font-medium text-yellow-700 mb-1">
										💡 Suggest a change:
									</label>
									<input
										type="number"
										value={suggestions.term_months || ""}
										onChange={(e) => setSuggestions({ ...suggestions, term_months: e.target.value })}
										placeholder="e.g., 12"
										className="w-full px-3 py-2 border border-yellow-300 rounded-lg bg-yellow-50 text-sm"
									/>
								</div>
							)}
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Confidentiality Period (months) <span className="text-red-500">*</span>
							</label>
							<input
								type="number"
								value={values.confidentiality_period_months}
								disabled
								className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
							/>
							{showSuggestions && (
								<div className="mt-2">
									<label className="block text-xs font-medium text-yellow-700 mb-1">
										💡 Suggest a change:
									</label>
									<input
										type="number"
										value={suggestions.confidentiality_period_months || ""}
										onChange={(e) => setSuggestions({ ...suggestions, confidentiality_period_months: e.target.value })}
										placeholder="e.g., 24"
										className="w-full px-3 py-2 border border-yellow-300 rounded-lg bg-yellow-50 text-sm"
									/>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Party A (Read-only with suggestion fields) */}
				<div className="bg-white rounded-lg shadow-sm p-6 mb-6">
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-xl font-semibold">Party A (Disclosing Party)</h2>
						<button
							onClick={() => setShowSuggestions(!showSuggestions)}
							className="px-4 py-2 text-sm bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors flex items-center gap-2"
						>
							💡 {showSuggestions ? "Hide" : "Suggest Changes"}
						</button>
					</div>
					
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
							<input
								type="text"
								value={values.party_a_name}
								disabled
								className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
							/>
							{showSuggestions && (
								<div className="mt-2">
									<label className="block text-xs font-medium text-yellow-700 mb-1">
										💡 Suggest a change:
									</label>
									<input
										type="text"
										value={suggestions.party_a_name || ""}
										onChange={(e) => setSuggestions({ ...suggestions, party_a_name: e.target.value })}
										placeholder="Suggest different name..."
										className="w-full px-3 py-2 border border-yellow-300 rounded-lg bg-yellow-50 text-sm"
									/>
								</div>
							)}
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
							<input
								type="text"
								value={values.party_a_title}
								disabled
								className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
							/>
							{showSuggestions && (
								<div className="mt-2">
									<label className="block text-xs font-medium text-yellow-700 mb-1">
										💡 Suggest a change:
									</label>
									<input
										type="text"
										value={suggestions.party_a_title || ""}
										onChange={(e) => setSuggestions({ ...suggestions, party_a_title: e.target.value })}
										placeholder="Suggest different title..."
										className="w-full px-3 py-2 border border-yellow-300 rounded-lg bg-yellow-50 text-sm"
									/>
								</div>
							)}
						</div>
						<div className="md:col-span-2">
							<label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
							<textarea
								value={values.party_a_address}
								disabled
								rows={2}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
							/>
							{showSuggestions && (
								<div className="mt-2">
									<label className="block text-xs font-medium text-yellow-700 mb-1">
										💡 Suggest a change:
									</label>
									<textarea
										value={suggestions.party_a_address || ""}
										onChange={(e) => setSuggestions({ ...suggestions, party_a_address: e.target.value })}
										placeholder="Suggest different address..."
										rows={2}
										className="w-full px-3 py-2 border border-yellow-300 rounded-lg bg-yellow-50 text-sm"
									/>
								</div>
							)}
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">Signatory Name</label>
							<input
								type="text"
								value={values.party_a_signatory_name}
								disabled
								className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
							/>
							{showSuggestions && (
								<div className="mt-2">
									<label className="block text-xs font-medium text-yellow-700 mb-1">
										💡 Suggest a change:
									</label>
									<input
										type="text"
										value={suggestions.party_a_signatory_name || ""}
										onChange={(e) => setSuggestions({ ...suggestions, party_a_signatory_name: e.target.value })}
										placeholder="Suggest different signatory name..."
										className="w-full px-3 py-2 border border-yellow-300 rounded-lg bg-yellow-50 text-sm"
									/>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Additional Terms Section */}
				<div className="bg-white rounded-lg shadow-sm p-6 mb-6">
					<h2 className="text-xl font-semibold mb-4">Additional Terms & Clauses</h2>
					<div className="space-y-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">Governing Law</label>
							<input
								type="text"
								value={values.governing_law}
								disabled
								className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
							/>
							{showSuggestions && (
								<div className="mt-2">
									<label className="block text-xs font-medium text-yellow-700 mb-1">
										💡 Suggest a change:
									</label>
									<input
										type="text"
										value={suggestions.governing_law || ""}
										onChange={(e) => setSuggestions({ ...suggestions, governing_law: e.target.value })}
										placeholder="e.g., State of California"
										className="w-full px-3 py-2 border border-yellow-300 rounded-lg bg-yellow-50 text-sm"
									/>
								</div>
							)}
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">IP Ownership Clause</label>
							<textarea
								value={values.ip_ownership}
								disabled
								rows={2}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
							/>
							{showSuggestions && (
								<div className="mt-2">
									<label className="block text-xs font-medium text-yellow-700 mb-1">
										💡 Suggest a change:
									</label>
									<textarea
										value={suggestions.ip_ownership || ""}
										onChange={(e) => setSuggestions({ ...suggestions, ip_ownership: e.target.value })}
										placeholder="Suggest changes to IP ownership terms..."
										rows={2}
										className="w-full px-3 py-2 border border-yellow-300 rounded-lg bg-yellow-50 text-sm"
									/>
								</div>
							)}
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">Non-Solicitation Clause</label>
							<textarea
								value={values.non_solicit}
								disabled
								rows={2}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
							/>
							{showSuggestions && (
								<div className="mt-2">
									<label className="block text-xs font-medium text-yellow-700 mb-1">
										💡 Suggest a change:
									</label>
									<textarea
										value={suggestions.non_solicit || ""}
										onChange={(e) => setSuggestions({ ...suggestions, non_solicit: e.target.value })}
										placeholder="Suggest changes to non-solicitation terms..."
										rows={2}
										className="w-full px-3 py-2 border border-yellow-300 rounded-lg bg-yellow-50 text-sm"
									/>
								</div>
							)}
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">Exclusivity Clause</label>
							<textarea
								value={values.exclusivity}
								disabled
								rows={2}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
							/>
							{showSuggestions && (
								<div className="mt-2">
									<label className="block text-xs font-medium text-yellow-700 mb-1">
										💡 Suggest a change:
									</label>
									<textarea
										value={suggestions.exclusivity || ""}
										onChange={(e) => setSuggestions({ ...suggestions, exclusivity: e.target.value })}
										placeholder="Suggest changes to exclusivity terms..."
										rows={2}
										className="w-full px-3 py-2 border border-yellow-300 rounded-lg bg-yellow-50 text-sm"
									/>
								</div>
							)}
						</div>
					</div>

					{showSuggestions && (
						<div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
							<h3 className="text-sm font-semibold text-yellow-900 mb-2">
								💡 Additional Comments or Suggestions
							</h3>
							<textarea
								value={suggestions.general_comments || ""}
								onChange={(e) => setSuggestions({ ...suggestions, general_comments: e.target.value })}
								placeholder="Any other comments or concerns about Party A's information..."
								rows={3}
								className="w-full px-3 py-2 border border-yellow-300 rounded-lg bg-white text-sm"
							/>
							<button
								onClick={sendBackWithSuggestions}
								disabled={sendingBack}
								className="mt-4 w-full px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 disabled:bg-gray-400 font-semibold flex items-center justify-center gap-2"
							>
								{sendingBack ? (
									"Sending..."
								) : (
									<>
										📤 Send Back to Party A for Review
									</>
								)}
							</button>
							<p className="mt-2 text-xs text-gray-600 text-center">
								Party A will receive your suggestions and can accept, reject, or edit the information
							</p>
						</div>
					)}
				</div>

				{/* Party B (Editable if allowed) */}
				<div className="bg-white rounded-lg shadow-sm p-6 mb-6">
					<h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
						Party B (Receiving Party) - Your Information
						{canEdit && (
							<span className="text-sm font-normal text-blue-600">✏️ Editable</span>
						)}
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
							<input
								type="text"
								value={values.party_b_name}
								onChange={(e) => handleChange("party_b_name", e.target.value)}
								disabled={!canEdit}
								className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${
									canEdit ? "bg-white" : "bg-gray-50"
								}`}
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
							<input
								type="text"
								value={values.party_b_title}
								onChange={(e) => handleChange("party_b_title", e.target.value)}
								disabled={!canEdit}
								className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${
									canEdit ? "bg-white" : "bg-gray-50"
								}`}
							/>
						</div>
						<div className="md:col-span-2">
							<label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
							<textarea
								value={values.party_b_address}
								onChange={(e) => handleChange("party_b_address", e.target.value)}
								disabled={!canEdit}
								rows={2}
								className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${
									canEdit ? "bg-white" : "bg-gray-50"
								}`}
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
							<input
								type="email"
								value={values.party_b_email}
								onChange={(e) => handleChange("party_b_email", e.target.value)}
								disabled={!canEdit}
								className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${
									canEdit ? "bg-white" : "bg-gray-50"
								}`}
							/>
						</div>
					</div>

					{canEdit && (
						<button
							onClick={saveChanges}
							disabled={saving}
							className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
						>
							{saving ? "Saving..." : "Save Changes"}
						</button>
					)}
				</div>

				{/* Signature Section */}
				{canSign && (
					<div className="bg-white rounded-lg shadow-sm p-6 mb-6 border-2 border-blue-200">
						<h2 className="text-xl font-semibold mb-4">Sign Document</h2>
						<p className="text-gray-600 mb-4">
							By signing below, you agree to the terms and conditions of this Non-Disclosure Agreement.
						</p>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Your Full Name (Signature) *
								</label>
								<input
									type="text"
									value={signatureData.party_b_signatory_name}
									onChange={(e) =>
										setSignatureData({ ...signatureData, party_b_signatory_name: e.target.value })
									}
									placeholder="Enter your full name"
									className="w-full px-3 py-2 border border-gray-300 rounded-lg font-serif text-lg"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
								<input
									type="date"
									value={signatureData.signature_date}
									onChange={(e) =>
										setSignatureData({ ...signatureData, signature_date: e.target.value })
									}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg"
								/>
							</div>
						</div>
						<button
							onClick={signDocument}
							disabled={signing || !signatureData.party_b_signatory_name.trim()}
							className="mt-4 px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-semibold"
						>
							{signing ? "Signing..." : "✍️ Sign Document"}
						</button>
					</div>
				)}

				{/* Actions */}
				<div className="bg-white rounded-lg shadow-sm p-6">
					<div className="flex flex-wrap gap-3">
						<button
							onClick={generatePreview}
							className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
						>
							📄 Preview PDF
						</button>
						<button
							onClick={() => router.push("/")}
							className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
						>
							Close
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
