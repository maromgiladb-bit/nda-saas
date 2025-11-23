"use client";
import React, { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import PublicToolbar from "@/components/PublicToolbar";
import { sanitizeForHtml } from "@/lib/sanitize";

type FormValues = {
	docName: string;
	effective_date: string;
	term_months: string;
	confidentiality_period_months: string;
	party_a_name: string;
	party_a_address: string;
	party_a_phone: string;
	party_a_signatory_name: string;
	party_a_title: string;
	party_b_name: string;
	party_b_address: string;
	party_b_phone: string;
	party_b_signatory_name: string;
	party_b_title: string;
	party_b_email: string;
	governing_law: string;
	ip_ownership: string;
	non_solicit: string;
	exclusivity: string;
};

// Helper component for field with suggestion
const FieldWithSuggestion = ({ 
	label, value, field, suggestions, setSuggestions, 
	type = "text", rows, required = false 
}: {
	label: string;
	value: string;
	field: string;
	suggestions: Record<string, string>;
	setSuggestions: (s: Record<string, string>) => void;
	type?: string;
	rows?: number;
	required?: boolean;
}) => {
	const hasSuggestion = suggestions[field] !== undefined;
	const InputComponent = rows ? "textarea" : "input";
	
	return (
		<div>
			<label className="block text-sm font-medium text-gray-700 mb-1">
				{label} {required && <span className="text-red-500">*</span>}
			</label>
			<InputComponent
				type={type}
				value={value}
				disabled
				rows={rows}
				className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
			/>
			{value && !hasSuggestion ? (
				<button
					onClick={() => setSuggestions({ ...suggestions, [field]: "" })}
					className="mt-2 text-xs text-teal-600 hover:text-teal-700 font-semibold"
				>
					💡 Suggest a change
				</button>
			) : hasSuggestion && (
				<div className="mt-2">
					<label className="block text-xs font-semibold text-teal-700 mb-1">
						💡 Your suggestion:
					</label>
					<InputComponent
						type={type}
						value={suggestions[field]}
						onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => 
							setSuggestions({ ...suggestions, [field]: e.target.value })
						}
						placeholder={`Suggest changes to ${label.toLowerCase()}...`}
						rows={rows}
						className="w-full px-3 py-2 border border-teal-300 rounded-lg bg-teal-50 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
					/>
					<button
						onClick={() => {
							const newSuggestions = { ...suggestions };
							delete newSuggestions[field];
							setSuggestions(newSuggestions);
						}}
						className="mt-1 text-xs text-gray-500 hover:text-gray-700 font-medium"
					>
						✕ Cancel
					</button>
				</div>
			)}
		</div>
	);
};

// Helper component for editable Party B field
const EditableField = ({
	label, value, field, onChange, disabled, type = "text", rows, required = false
}: {
	label: string;
	value: string;
	field: keyof FormValues;
	onChange: (field: keyof FormValues, value: string) => void;
	disabled: boolean;
	type?: string;
	rows?: number;
	required?: boolean;
}) => {
	const isEmpty = !value || value.trim() === "";
	const InputComponent = rows ? "textarea" : "input";
	
	return (
		<div>
			<label className="block text-sm font-medium text-gray-700 mb-1">
				{label} {required && <span className="text-red-500">*</span>}
			</label>
			<InputComponent
				type={type}
				value={value}
				onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => 
					onChange(field, e.target.value)
				}
				disabled={disabled}
				rows={rows}
				placeholder={!disabled && isEmpty ? "Waiting for your input..." : ""}
				className={`w-full px-3 py-2 border rounded-lg transition-colors ${
					disabled 
						? "bg-gray-50 border-gray-300" 
						: isEmpty
						? "bg-teal-50 border-teal-300 border-2 placeholder-teal-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
						: "bg-white border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
				}`}
			/>
			{!disabled && isEmpty && (
				<p className="mt-1 text-xs text-teal-600 font-medium">⏳ Waiting for your input</p>
			)}
		</div>
	);
};

export default function ReviewNDA({ params }: { params: Promise<{ token: string }> }) {
	const { token } = use(params);
	const router = useRouter();
	const [values, setValues] = useState<FormValues | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [saving, setSaving] = useState(false);
	const [generatingPreview, setGeneratingPreview] = useState(false);
	const [downloadingPdf, setDownloadingPdf] = useState(false);
	const [templateId, setTemplateId] = useState<string>("professional_mutual_nda_v1");
	const [draftId, setDraftId] = useState<string | null>(null);
	const [tokenScope, setTokenScope] = useState<string>("VIEW");
	const [signing, setSigning] = useState(false);
	const [signatureData, setSignatureData] = useState({
		party_b_signatory_name: "",
		signature_date: new Date().toISOString().slice(0, 10),
	});
	const [suggestions, setSuggestions] = useState<Record<string, string>>({});
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
			setTemplateId(data.templateId || "professional_mutual_nda_v1");
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

		// Validate required Party B fields
		const requiredFields = {
			party_b_name: "Name",
			party_b_title: "Title",
			party_b_address: "Address",
			party_b_phone: "Phone Number",
			party_b_email: "Email",
			party_b_signatory_name: "Signatory Name"
		};

		const missingFields = Object.entries(requiredFields)
			.filter(([field]) => !values[field as keyof FormValues]?.trim())
			.map(([, label]) => label);

		if (missingFields.length > 0) {
			setError(`Please fill in all required Party B fields: ${missingFields.join(", ")}`);
			return;
		}

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

			setError(""); // Clear any previous errors
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

		setGeneratingPreview(true);
		setError(""); // Clear any previous errors
		
		try {
			console.log("📄 Generating PDF preview with data:", values);
			console.log("📋 Using template:", templateId);

			// Prepare the data for template rendering with sanitized values
			const templateData = {
				...values,
				templateId,
				// Map party_a_* to party_1_* and party_b_* to party_2_* for template compatibility
				// Sanitize all text fields to handle newlines and special characters
				party_1_name: sanitizeForHtml(values.party_a_name),
				party_1_address: sanitizeForHtml(values.party_a_address),
				party_1_signatory_name: sanitizeForHtml(values.party_a_signatory_name),
				party_1_signatory_title: sanitizeForHtml(values.party_a_title),
				party_1_phone: sanitizeForHtml(values.party_a_phone),
				party_1_emails_joined: '', // Not applicable
				party_2_name: sanitizeForHtml(values.party_b_name),
				party_2_address: sanitizeForHtml(values.party_b_address),
				party_2_signatory_name: sanitizeForHtml(values.party_b_signatory_name),
				party_2_signatory_title: sanitizeForHtml(values.party_b_title),
				party_2_phone: sanitizeForHtml(values.party_b_phone),
				party_2_emails_joined: sanitizeForHtml(values.party_b_email),
				effective_date_long: values.effective_date ? new Date(values.effective_date).toLocaleDateString('en-US', { 
					year: 'numeric', 
					month: 'long', 
					day: 'numeric' 
				}) : '',
				governing_law_full: sanitizeForHtml(values.governing_law),
				term_years_number: values.term_months ? Math.floor(parseInt(values.term_months) / 12) : '',
				term_years_words: values.term_months ? (Math.floor(parseInt(values.term_months) / 12) === 1 ? 'one' : 'two') : '',
				purpose: 'evaluating a potential business relationship',
				information_scope_text: 'All information and materials',
				// Sanitize other text fields that might have newlines
				ip_ownership: sanitizeForHtml(values.ip_ownership),
				additional_terms: sanitizeForHtml(values.additional_terms),
			};

			console.log("📦 Sending payload to PDF API");

			const res = await fetch("/api/ndas/preview", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(templateData),
			});

			console.log("📡 Response status:", res.status, res.statusText);
			console.log("📡 Response headers:", Object.fromEntries(res.headers.entries()));

			// Check if response is JSON
			const contentType = res.headers.get("content-type");
			if (!contentType || !contentType.includes("application/json")) {
				const text = await res.text();
				console.error("❌ Non-JSON response received:", text);
				setError(`Server error: Invalid response format (${res.status})`);
				return;
			}

			let json;
			try {
				json = await res.json();
				console.log("PDF Preview response:", json);
			} catch (parseError) {
				console.error("❌ Failed to parse JSON response:", parseError);
				setError("Server returned invalid JSON response");
				return;
			}

			if (!res.ok) {
				console.error("❌ PDF preview failed with status:", res.status);
				console.error("❌ Response body:", json);
				console.error("❌ Error details:", json.details);
				setError(json.error || json.details || `Preview failed (${res.status})`);
				return;
			}

			// fileUrl contains the data:application/pdf;base64,... string
			if (!json.fileUrl || !json.fileUrl.startsWith("data:application/pdf;base64,")) {
				throw new Error("Invalid PDF data received");
			}

			// Open PDF in new tab
			const newWindow = window.open();
			if (newWindow) {
				newWindow.document.write(`
					<!DOCTYPE html>
					<html>
					<head>
						<title>NDA PDF Preview</title>
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
			} else {
				// Fallback if popup blocked - just open in current tab
				window.open(json.fileUrl, '_blank');
			}

			console.log("✅ PDF preview opened successfully");
			setError(""); // Clear any previous errors
		} catch (err) {
			console.error("Preview error:", err);
			setError(err instanceof Error ? err.message : "Failed to generate preview");
		} finally {
			setGeneratingPreview(false);
		}
	};

	const downloadPDF = async () => {
		if (!values) return;

		setDownloadingPdf(true);
		setError(""); // Clear any previous errors
		
		try {
			console.log("📥 Generating PDF for download with data:", values);
			console.log("📋 Using template:", templateId);

			// Prepare the data for template rendering with sanitized values
			const templateData = {
				...values,
				templateId,
				// Map party_a_* to party_1_* and party_b_* to party_2_* for template compatibility
				// Sanitize all text fields to handle newlines and special characters
				party_1_name: sanitizeForHtml(values.party_a_name),
				party_1_address: sanitizeForHtml(values.party_a_address),
				party_1_signatory_name: sanitizeForHtml(values.party_a_signatory_name),
				party_1_signatory_title: sanitizeForHtml(values.party_a_title),
				party_1_phone: sanitizeForHtml(values.party_a_phone),
				party_1_emails_joined: '',
				party_2_name: sanitizeForHtml(values.party_b_name),
				party_2_address: sanitizeForHtml(values.party_b_address),
				party_2_signatory_name: sanitizeForHtml(values.party_b_signatory_name),
				party_2_signatory_title: sanitizeForHtml(values.party_b_title),
				party_2_phone: sanitizeForHtml(values.party_b_phone),
				party_2_emails_joined: sanitizeForHtml(values.party_b_email),
				effective_date_long: values.effective_date ? new Date(values.effective_date).toLocaleDateString('en-US', { 
					year: 'numeric', 
					month: 'long', 
					day: 'numeric' 
				}) : '',
				governing_law_full: sanitizeForHtml(values.governing_law),
				term_years_number: values.term_months ? Math.floor(parseInt(values.term_months) / 12) : '',
				term_years_words: values.term_months ? (Math.floor(parseInt(values.term_months) / 12) === 1 ? 'one' : 'two') : '',
				purpose: 'evaluating a potential business relationship',
				information_scope_text: 'All information and materials',
				// Sanitize other text fields that might have newlines
				ip_ownership: sanitizeForHtml(values.ip_ownership),
				additional_terms: sanitizeForHtml(values.additional_terms),
			};

			console.log("📦 Sending payload to PDF API");

			const res = await fetch("/api/ndas/preview", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(templateData),
			});

			console.log("📡 Response status:", res.status, res.statusText);

			// Check if response is JSON
			const contentType = res.headers.get("content-type");
			if (!contentType || !contentType.includes("application/json")) {
				const text = await res.text();
				console.error("❌ Non-JSON response received:", text);
				setError(`Server error: Invalid response format (${res.status})`);
				return;
			}

			let json;
			try {
				json = await res.json();
				console.log("PDF Download response:", json);
			} catch (parseError) {
				console.error("❌ Failed to parse JSON response:", parseError);
				setError("Server returned invalid JSON response");
				return;
			}

			if (!res.ok) {
				console.error("❌ PDF download failed with status:", res.status);
				console.error("❌ Response body:", json);
				console.error("❌ Error details:", json.details);
				setError(json.error || json.details || `Download failed (${res.status})`);
				return;
			}

			// fileUrl contains the data:application/pdf;base64,... string
			if (!json.fileUrl || !json.fileUrl.startsWith("data:application/pdf;base64,")) {
				throw new Error("Invalid PDF data received");
			}

			// Download PDF
			const link = document.createElement('a');
			link.href = json.fileUrl;
			link.download = `${values.docName || 'NDA'}.pdf`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);

			console.log("✅ PDF downloaded successfully");
			setError(""); // Clear any previous errors
		} catch (err) {
			console.error("Download error:", err);
			setError(err instanceof Error ? err.message : "Failed to download PDF");
		} finally {
			setDownloadingPdf(false);
		}
	};

	const sendBackWithSuggestions = async () => {
		if (!values) return;

		// Check if there are any suggestions
		const hasSuggestions = Object.keys(suggestions).some(key => suggestions[key]?.trim());
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

		// Validate required Party B fields before signing
		if (!values) return;
		
		const requiredFields = {
			party_b_name: "Name",
			party_b_title: "Title",
			party_b_address: "Address",
			party_b_phone: "Phone Number",
			party_b_email: "Email",
			party_b_signatory_name: "Signatory Name"
		};

		const missingFields = Object.entries(requiredFields)
			.filter(([field]) => !values[field as keyof FormValues]?.trim())
			.map(([, label]) => label);

		if (missingFields.length > 0) {
			setError(`Please fill in all required Party B fields before signing: ${missingFields.join(", ")}`);
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

			setError(""); // Clear any previous errors
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
			<div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
				<PublicToolbar />
				<div className="flex items-center justify-center min-h-[80vh]">
					<div className="text-center">
						<div className="animate-spin rounded-full h-16 w-16 border-b-4 border-teal-600 mx-auto"></div>
						<p className="mt-4 text-gray-600 font-medium">Loading NDA...</p>
					</div>
				</div>
			</div>
		);
	}

	if (error && !values) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
				<PublicToolbar />
				<div className="flex items-center justify-center min-h-[80vh]">
					<div className="text-center bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto">
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
	const hasSuggestions = Object.keys(suggestions).length > 0;

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
			<PublicToolbar />
			
			<div className="max-w-5xl mx-auto px-4 py-8">
				{/* Header */}
				<div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-2xl shadow-xl p-8 mb-8 text-white">
					<div className="flex items-start justify-between">
						<div className="flex-1">
							<h1 className="text-4xl font-bold mb-3">
								Review & Sign NDA
							</h1>
							<p className="text-teal-50 text-lg mb-4">
								{values.docName || "Non-Disclosure Agreement"}
							</p>
							<p className="text-teal-100 text-sm">
								{canEdit && "📝 You can edit your information and suggest changes to other fields"}
								{!canEdit && "👀 Review the document details below"}
							</p>
						</div>
						<div className="flex gap-2">
							<button
								onClick={generatePreview}
								disabled={generatingPreview || downloadingPdf}
								className={`px-4 py-2 rounded-lg font-semibold transition-all backdrop-blur-sm ${
									generatingPreview 
										? 'bg-white/10 text-white/60 cursor-wait' 
										: 'bg-white/20 hover:bg-white/30 text-white'
								}`}
								title="Preview PDF"
							>
								{generatingPreview ? (
									<span className="flex items-center gap-2">
										<svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
										Generating...
									</span>
								) : (
									<>👁️ Preview</>
								)}
							</button>
							<button
								onClick={downloadPDF}
								disabled={generatingPreview || downloadingPdf}
								className={`px-4 py-2 rounded-lg font-semibold transition-all backdrop-blur-sm ${
									downloadingPdf 
										? 'bg-white/10 text-white/60 cursor-wait' 
										: 'bg-white/20 hover:bg-white/30 text-white'
								}`}
								title="Download PDF"
							>
								{downloadingPdf ? (
									<span className="flex items-center gap-2">
										<svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
										Downloading...
									</span>
								) : (
									<>⬇️ Download</>
								)}
							</button>
						</div>
					</div>
					{error && (
						<div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 font-medium">
							{error}
						</div>
					)}
				</div>

				{/* Party B (Editable if allowed) */}
				<div className="bg-gradient-to-br from-teal-50 to-white rounded-2xl shadow-lg p-8 mb-8 border-2 border-teal-200">
					<div className="flex items-center justify-between mb-6">
						<div className="flex items-center gap-3">
							<div className="w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center text-white text-xl font-bold">
								B
							</div>
							<div>
								<h2 className="text-2xl font-bold text-gray-900">Your Information</h2>
								<p className="text-sm text-gray-600">Receiving Party (Party B)</p>
							</div>
						</div>
						{canEdit && (
							<span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-lg text-sm font-semibold">
								✏️ Editable
							</span>
						)}
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<EditableField
							label="Name"
							value={values.party_b_name}
							field="party_b_name"
							onChange={handleChange}
							disabled={!canEdit}
							required
						/>
						<EditableField
							label="Title"
							value={values.party_b_title}
							field="party_b_title"
							onChange={handleChange}
							disabled={!canEdit}
							required
						/>
						<div className="md:col-span-2">
							<EditableField
								label="Address"
								value={values.party_b_address}
								field="party_b_address"
								onChange={handleChange}
								disabled={!canEdit}
								rows={2}
								required
							/>
						</div>
						<EditableField
							label="Phone Number"
							value={values.party_b_phone || ''}
							field="party_b_phone"
							onChange={handleChange}
							disabled={!canEdit}
							type="tel"
							required
						/>
						<EditableField
							label="Email"
							value={values.party_b_email}
							field="party_b_email"
							onChange={handleChange}
							disabled={!canEdit}
							type="email"
							required
						/>
						<EditableField
							label="Signatory Name"
							value={values.party_b_signatory_name}
							field="party_b_signatory_name"
							onChange={handleChange}
							disabled={!canEdit}
							required
						/>
					</div>
					{canEdit && (
						<button
							onClick={saveChanges}
							disabled={saving}
							className="mt-6 px-8 py-3 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 disabled:bg-gray-400 shadow-sm transition-all"
						>
							{saving ? "Saving..." : "💾 Save Changes"}
						</button>
					)}
				</div>

				{/* Document Info */}
				<div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
					<div className="flex items-center gap-3 mb-6">
						<div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">
							📄
						</div>
						<div>
							<h2 className="text-2xl font-bold text-gray-900">Document Details</h2>
							<p className="text-sm text-gray-600">Agreement terms and timeline</p>
						</div>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<FieldWithSuggestion 
							label="Purpose/Topic" 
							value={values.docName} 
							field="docName" 
							suggestions={suggestions} 
							setSuggestions={setSuggestions}
							required
						/>
						<FieldWithSuggestion 
							label="Effective Date" 
							value={values.effective_date} 
							field="effective_date" 
							suggestions={suggestions} 
							setSuggestions={setSuggestions}
							type="date"
							required
						/>
						<FieldWithSuggestion 
							label="Term (months)" 
							value={values.term_months} 
							field="term_months" 
							suggestions={suggestions} 
							setSuggestions={setSuggestions}
							type="number"
							required
						/>
						<FieldWithSuggestion 
							label="Confidentiality Period (months)" 
							value={values.confidentiality_period_months} 
							field="confidentiality_period_months" 
							suggestions={suggestions} 
							setSuggestions={setSuggestions}
							type="number"
							required
						/>
					</div>
				</div>

				{/* Party A (Read-only with suggestion fields) */}
				<div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
					<div className="flex items-center justify-between mb-6">
						<div className="flex items-center gap-3">
							<div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center text-gray-700 text-xl font-bold">
								A
							</div>
							<div>
								<h2 className="text-2xl font-bold text-gray-900">Disclosing Party</h2>
								<p className="text-sm text-gray-600">Party A - Can suggest changes</p>
							</div>
						</div>
						<span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-sm font-semibold">
							💡 Suggest Changes
						</span>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<FieldWithSuggestion 
							label="Name" 
							value={values.party_a_name} 
							field="party_a_name" 
							suggestions={suggestions} 
							setSuggestions={setSuggestions}
							required
						/>
						<FieldWithSuggestion 
							label="Title" 
							value={values.party_a_title} 
							field="party_a_title" 
							suggestions={suggestions} 
							setSuggestions={setSuggestions}
						/>
						<div className="md:col-span-2">
							<FieldWithSuggestion 
								label="Address" 
								value={values.party_a_address} 
								field="party_a_address" 
								suggestions={suggestions} 
								setSuggestions={setSuggestions}
								rows={2}
							/>
						</div>
						<FieldWithSuggestion 
							label="Phone Number" 
							value={values.party_a_phone || ''} 
							field="party_a_phone" 
							suggestions={suggestions} 
							setSuggestions={setSuggestions}
							type="tel"
						/>
						<FieldWithSuggestion 
							label="Signatory Name" 
							value={values.party_a_signatory_name} 
							field="party_a_signatory_name" 
							suggestions={suggestions} 
							setSuggestions={setSuggestions}
						/>
					</div>
				</div>

				{/* Additional Terms Section */}
				<div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
					<div className="flex items-center gap-3 mb-6">
						<div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl">
							📋
						</div>
						<div>
							<h2 className="text-2xl font-bold text-gray-900">Additional Terms</h2>
							<p className="text-sm text-gray-600">Legal clauses and conditions</p>
						</div>
					</div>
					<div className="space-y-4">
						<FieldWithSuggestion 
							label="Governing Law" 
							value={values.governing_law} 
							field="governing_law" 
							suggestions={suggestions} 
							setSuggestions={setSuggestions}
						/>
						<FieldWithSuggestion 
							label="IP Ownership Clause" 
							value={values.ip_ownership} 
							field="ip_ownership" 
							suggestions={suggestions} 
							setSuggestions={setSuggestions}
							rows={2}
						/>
						<FieldWithSuggestion 
							label="Non-Solicitation Clause" 
							value={values.non_solicit} 
							field="non_solicit" 
							suggestions={suggestions} 
							setSuggestions={setSuggestions}
							rows={2}
						/>
						<FieldWithSuggestion 
							label="Exclusivity Clause" 
							value={values.exclusivity} 
							field="exclusivity" 
							suggestions={suggestions} 
							setSuggestions={setSuggestions}
							rows={2}
						/>
					</div>

					{hasSuggestions && (
						<div className="mt-8 p-6 bg-teal-50 border-2 border-teal-200 rounded-xl">
							<h3 className="text-base font-bold text-teal-900 mb-3">
								💡 Additional Comments or Suggestions
							</h3>
							<textarea
								value={suggestions.general_comments || ""}
								onChange={(e) => setSuggestions({ ...suggestions, general_comments: e.target.value })}
								placeholder="Any other comments or concerns..."
								rows={3}
								className="w-full px-4 py-3 border border-teal-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
							/>
							<button
								onClick={sendBackWithSuggestions}
								disabled={sendingBack}
								className="mt-4 w-full px-6 py-4 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-400 font-semibold flex items-center justify-center gap-2 shadow-lg transition-all"
							>
								{sendingBack ? "Sending..." : "📤 Send Back to Party A for Review"}
							</button>
							<p className="mt-3 text-xs text-gray-600 text-center">
								Party A will receive your suggestions and can accept, reject, or edit the information
							</p>
						</div>
					)}
				</div>

				{/* Signature Section */}
				{canSign && (
					<div className="bg-gradient-to-br from-green-50 to-white rounded-2xl shadow-lg p-8 mb-8 border-2 border-green-200">
						<div className="flex items-center gap-3 mb-4">
							<div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center text-white text-2xl">
								✍️
							</div>
							<div>
								<h2 className="text-2xl font-bold text-gray-900">Sign Document</h2>
								<p className="text-sm text-gray-600">Digitally sign to accept the terms</p>
							</div>
						</div>
						<div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
							<p className="text-sm text-yellow-800">
								<span className="font-semibold">⚠️ Important:</span> By signing below, you legally agree to all terms and conditions of this Non-Disclosure Agreement.
							</p>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-semibold text-gray-700 mb-1">
									Your Full Name (Signature) *
								</label>
								<input
									type="text"
									value={signatureData.party_b_signatory_name}
									onChange={(e) =>
										setSignatureData({ ...signatureData, party_b_signatory_name: e.target.value })
									}
									placeholder="Enter your full name"
									className="w-full px-4 py-3 border border-gray-300 rounded-lg font-serif text-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
								/>
							</div>
							<div>
								<label className="block text-sm font-semibold text-gray-700 mb-1">Date</label>
								<input
									type="date"
									value={signatureData.signature_date}
									onChange={(e) =>
										setSignatureData({ ...signatureData, signature_date: e.target.value })
									}
									className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
								/>
							</div>
						</div>
						<button
							onClick={signDocument}
							disabled={signing || !signatureData.party_b_signatory_name.trim()}
							className="mt-6 px-10 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-bold text-lg shadow-lg transition-all"
						>
							{signing ? "Signing..." : "✍️ Sign Document"}
						</button>
					</div>
				)}

				{/* Quick Actions */}
				<div className="bg-white rounded-2xl shadow-lg p-6">
					<div className="flex flex-wrap items-center justify-between gap-4">
						<div className="flex items-center gap-3 text-gray-600 text-sm">
							<span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
							Changes auto-saved
						</div>
						<div className="flex flex-wrap gap-3">
							<button
								onClick={() => router.push("/")}
								className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold transition-all"
							>
								← Back
							</button>
							<button
								onClick={downloadPDF}
								disabled={generatingPreview || downloadingPdf}
								className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${
									downloadingPdf 
										? 'bg-blue-50 text-blue-400 cursor-wait' 
										: 'bg-blue-100 text-blue-700 hover:bg-blue-200'
								}`}
							>
								{downloadingPdf ? (
									<span className="flex items-center gap-2">
										<svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
										Downloading...
									</span>
								) : (
									<>⬇️ Download PDF</>
								)}
							</button>
							<button
								onClick={generatePreview}
								disabled={generatingPreview || downloadingPdf}
								className={`px-6 py-2.5 rounded-lg font-semibold shadow-sm transition-all ${
									generatingPreview 
										? 'bg-teal-400 text-white cursor-wait' 
										: 'bg-teal-600 text-white hover:bg-teal-700'
								}`}
							>
								{generatingPreview ? (
									<span className="flex items-center gap-2">
										<svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
										Generating...
									</span>
								) : (
									<>👁️ Preview PDF</>
								)}
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
