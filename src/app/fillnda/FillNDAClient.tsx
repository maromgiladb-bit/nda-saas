"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser, RedirectToSignIn } from "@clerk/nextjs";
import PublicToolbar from "@/components/PublicToolbar";
import PDFPreview from "@/components/PDFPreview";

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
	party_a_ask_receiver_fill: boolean;
	party_b_ask_receiver_fill: boolean;
};

const DEFAULTS: FormValues = {
	docName: "",
	effective_date: new Date().toISOString().slice(0, 10),
	term_months: "",
	confidentiality_period_months: "",
	party_a_name: "",
	party_a_address: "",
	party_a_signatory_name: "",
	party_a_title: "",
	party_b_name: "",
	party_b_address: "",
	party_b_signatory_name: "",
	party_b_title: "",
	party_b_email: "",
	governing_law: "",
	ip_ownership: "",
	non_solicit: "",
	exclusivity: "",
	party_a_ask_receiver_fill: false,
	party_b_ask_receiver_fill: false,
};

export default function FillNDAClient() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { isLoaded, user } = useUser();
	const [values, setValues] = useState<FormValues>(DEFAULTS);
	const [warning, setWarning] = useState("");
	const [saving, setSaving] = useState(false);
	const [showPreview, setShowPreview] = useState(false);
	const [previewUrl, setPreviewUrl] = useState("");
	const [draftId, setDraftId] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [showSendModal, setShowSendModal] = useState(false);
	const [signersEmail, setSignersEmail] = useState("");
	const [sendingForSignature, setSendingForSignature] = useState(false);
	const [shareableLink, setShareableLink] = useState("");
	const [showShareLinkModal, setShowShareLinkModal] = useState(false);
	const [validationErrors, setValidationErrors] = useState<Set<string>>(new Set());
	const [step, setStep] = useState<number>(0);
	const [showSaveConfirmModal, setShowSaveConfirmModal] = useState(false);
	const [showExitWarningModal, setShowExitWarningModal] = useState(false);
	const [templateId, setTemplateId] = useState<string>("mutual-nda-v3"); // Default template
	
	// Email suggestions state
	const [emailSuggestions, setEmailSuggestions] = useState<Array<{
		email: string;
		count: number;
		lastUsed: string;
		recentNda: string;
		hasSignedBefore: boolean;
	}>>([]);
	const [showEmailSuggestions, setShowEmailSuggestions] = useState(false);
	const [loadingSuggestions, setLoadingSuggestions] = useState(false);

	const steps = ["Document", "Party A", "Party B", "Clauses", "Review"];

	useEffect(() => {
		// Sync user to database (best-effort)
		if (user?.emailAddresses?.[0]?.emailAddress) {
			fetch("/api/users/sync", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email: user.emailAddresses[0].emailAddress }),
			}).catch(() => {});
		}

		const urlDraftId = searchParams.get("draftId");
		const urlTemplateId = searchParams.get("templateId");
		const isNewNda = searchParams.get("new") === "true";
		
		// Set template ID from URL or use default
		if (urlTemplateId) {
			console.log("📋 Using template:", urlTemplateId);
			setTemplateId(urlTemplateId);
		}
		
		if (isNewNda) {
			// Starting a new NDA - clear everything and use defaults
			console.log("🆕 Starting new NDA - clearing all data");
			setValues(DEFAULTS);
			setDraftId(null);
			localStorage.removeItem("fillndaDraft");
		} else if (urlDraftId) {
			// Loading specific draft from URL
			loadDraft(urlDraftId);
		} else {
			// Try to load from localStorage (auto-save)
			const d = localStorage.getItem("fillndaDraft");
			if (d) {
				try {
					const parsed = JSON.parse(d);
					setValues({ ...DEFAULTS, ...(parsed.values || {}) });
					setDraftId(parsed.draftId || null);
					console.log("📂 Restored from localStorage");
				} catch (e) {
					console.error(e);
				}
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user]);

	const loadDraft = async (id: string) => {
		console.log('=== Loading draft ===')
		console.log('Draft ID:', id)
		setLoading(true);
		try {
			const res = await fetch(`/api/ndas/drafts/${id}`);
			console.log('Response status:', res.status)
			
			const json = await res.json();
			console.log('Response data:', json)
			
			if (!res.ok) throw new Error(json.error || "Failed to load draft");
			
			if (json.draft?.data) {
				console.log('Setting form values from draft data:', json.draft.data)
				setValues({ ...DEFAULTS, ...json.draft.data });
				setDraftId(json.draft.id);
				// Update document name if it exists in the draft
				if (json.draft.title) {
					setValues(prev => ({ ...prev, docName: json.draft.title }));
				}
			} else {
				console.log('No draft data found, using defaults')
				setValues(DEFAULTS);
			}
		} catch (e) {
			console.error('Load draft error:', e)
			setWarning(e instanceof Error ? e.message : "Failed to load draft");
		} finally {
			setLoading(false);
		}
	};

	const setField = (k: keyof FormValues, v: string | boolean) => {
		setValues((s) => ({ ...s, [k]: v } as unknown as FormValues));
		const keyStr = k as unknown as string;
		if (validationErrors.has(keyStr)) {
			const newErrors = new Set(validationErrors);
			newErrors.delete(keyStr);
			setValidationErrors(newErrors);
		}
	};

	const getFieldClass = (fieldName: string, baseClass: string = "p-2 border") => {
		const hasError = validationErrors.has(fieldName);
		return `${baseClass} ${hasError ? "border-red-500 bg-red-50" : "border-gray-300"}`;
	};

	const validate = (): { isValid: boolean; errors: Set<string>; message: string | null } => {
		const errors = new Set<string>();
		const mandatoryFields = [
			"docName",
			"effective_date",
			"term_months",
			"confidentiality_period_months",
			"governing_law",
			"ip_ownership",
			"non_solicit",
			"exclusivity",
		];

		// Add Party A fields only if not asking receiver to fill
		if (!values.party_a_ask_receiver_fill) {
			mandatoryFields.push("party_a_name", "party_a_address", "party_a_signatory_name", "party_a_title");
		}

		// Add Party B fields only if not asking receiver to fill
		if (!values.party_b_ask_receiver_fill) {
			mandatoryFields.push("party_b_name", "party_b_address", "party_b_signatory_name", "party_b_title", "party_b_email");
		}

		mandatoryFields.forEach((field) => {
			const value = values[field as keyof FormValues];
			if (value === undefined || value === null) {
				errors.add(field);
				return;
			}
			if (typeof value === "string" && !value.trim()) {
				errors.add(field);
			}
		});

		// Still validate email format if Party B email is provided or not asking receiver to fill
		if (!values.party_b_ask_receiver_fill && (!values.party_b_email || !values.party_b_email.includes("@"))) {
			errors.add("party_b_email");
		}

		let message = null;
		if (errors.size > 0) {
			message = `Please fill in ${errors.size} required field(s)`;
		}

		return { isValid: errors.size === 0, errors, message };
	};

	const isStepComplete = (s: number) => {
		const stepFields: string[] = [];
		switch (s) {
			case 0:
				stepFields.push("docName", "term_months", "confidentiality_period_months");
				break;
			case 1:
				// Party A fields only required if not asking receiver to fill
				if (!values.party_a_ask_receiver_fill) {
					stepFields.push("party_a_name", "party_a_address", "party_a_signatory_name", "party_a_title");
				} else {
					// If asking receiver to fill, step is complete
					return true;
				}
				break;
			case 2:
				// Party B fields only required if not asking receiver to fill
				if (!values.party_b_ask_receiver_fill) {
					stepFields.push("party_b_name", "party_b_address", "party_b_signatory_name", "party_b_title", "party_b_email");
				} else {
					// If asking receiver to fill, step is complete
					return true;
				}
				break;
			case 3:
				// Clauses considered complete if present (but mandatory globally)
				stepFields.push("governing_law", "ip_ownership", "non_solicit", "exclusivity");
				break;
			case 4:
				// review - all mandatory fields based on ask_receiver_fill flags
				stepFields.push(
					"docName",
					"effective_date",
					"term_months",
					"confidentiality_period_months",
				);
				// Add party fields only if not asking receiver to fill
				if (!values.party_a_ask_receiver_fill) {
					stepFields.push("party_a_name");
				}
				if (!values.party_b_ask_receiver_fill) {
					stepFields.push("party_b_name", "party_b_email");
				}
				break;
			default:
				return false;
		}

		for (const field of stepFields) {
			const val = values[field as keyof FormValues];
			if (!val || (typeof val === "string" && !val.trim())) return false;
			if (field === "party_b_email" && !values.party_b_ask_receiver_fill && !values.party_b_email.includes("@")) return false;
		}
		return true;
	};

	const computeCompletionPercent = () => {
		const requiredFields = [
			"docName",
			"effective_date",
			"term_months",
			"confidentiality_period_months",
			"party_a_name",
			"party_a_address",
			"party_a_signatory_name",
			"party_a_title",
			"party_b_name",
			"party_b_address",
			"party_b_signatory_name",
			"party_b_title",
			"party_b_email",
			"governing_law",
			"ip_ownership",
			"non_solicit",
			"exclusivity",
		];

		const total = requiredFields.length;
		let filled = 0;

		for (const field of requiredFields) {
			const val = values[field as keyof FormValues];
			if (val && typeof val === "string" && val.trim()) {
				if (field === "party_b_email") {
					if (val.includes("@")) filled += 1;
				} else {
					filled += 1;
				}
			}
		}

		return total === 0 ? 100 : Math.round((filled / total) * 100);
	};

	const goNext = () => {
		if (step < steps.length - 1) setStep(step + 1);
	};

	const goBack = () => {
		if (step > 0) setStep(step - 1);
	};

	const goToStep = (target: number) => {
		if (target === step) return;
		setWarning("");
		setStep(target);
	};

	const saveDraft = async () => {
		// If editing an existing draft, show confirmation modal
		if (draftId) {
			setShowSaveConfirmModal(true);
			return;
		}
		
		// New draft - save directly
		await performSave();
	};

	const performSave = async () => {
		setSaving(true);
		setWarning("");
		setShowSaveConfirmModal(false);
		try {
			const payload = { draftId, title: values.docName, data: values };
			const res = await fetch("/api/ndas/drafts", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			const json = await res.json();
			if (!res.ok) throw new Error(json.error || "Failed to save draft");
			setDraftId(json.draftId || json.id || draftId);
			localStorage.setItem("fillndaDraft", JSON.stringify({ values, draftId: json.draftId || json.id || draftId }));
			setWarning("Draft saved successfully.");
		} catch (e) {
			setWarning(e instanceof Error ? e.message : "Failed to save draft");
		} finally {
			setSaving(false);
		}
	};

	const preview = async () => {
		const validation = validate();
		if (!validation.isValid) {
			setValidationErrors(validation.errors);
			setWarning(validation.message || "Please fill in all required fields");
			console.error("Validation errors:", Array.from(validation.errors));
			return;
		}
		setValidationErrors(new Set());
		setWarning("");
		try {
			console.log("Sending preview request with data:", values);
			console.log("📋 Using template:", templateId);
			// Use new PDF preview endpoint (supports both draftId and direct data)
			const res = await fetch("/api/ndas/preview", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(draftId ? { draftId, templateId } : { ...values, templateId }),
			});
			const json = await res.json();
			console.log("Preview response:", json);
			if (!res.ok) {
				console.error("❌ Preview failed:", json);
				console.error("❌ Error details:", json.details);
				throw new Error(json.error || "Preview failed");
			}
			
			// fileUrl contains the data:application/pdf;base64,... string
			if (!json.fileUrl || !json.fileUrl.startsWith("data:application/pdf;base64,")) {
				throw new Error("Invalid PDF data received");
			}
			
			// Open PDF in new tab instead of modal
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
			} else {
				// Fallback if popup blocked - use modal
				setPreviewUrl(json.fileUrl);
				setShowPreview(true);
			}
			
			console.log("✅ PDF preview opened in new tab");
			setWarning(""); // Clear any previous warnings
		} catch (e) {
			console.error("Preview error:", e);
			setWarning(e instanceof Error ? e.message : "Preview failed");
		}
	};

	// Fetch email suggestions
	const fetchEmailSuggestions = async (query: string) => {
		if (!query || query.length < 2) {
			setEmailSuggestions([]);
			setShowEmailSuggestions(false);
			return;
		}

		try {
			setLoadingSuggestions(true);
			const res = await fetch(`/api/ndas/email-suggestions?q=${encodeURIComponent(query)}`);
			const data = await res.json();
			
			if (res.ok && data.suggestions) {
				setEmailSuggestions(data.suggestions);
				setShowEmailSuggestions(data.suggestions.length > 0);
			}
		} catch (error) {
			console.error("Failed to fetch email suggestions:", error);
		} finally {
			setLoadingSuggestions(false);
		}
	};

	// Handle email input change with debounce
	const handleEmailChange = (email: string) => {
		setSignersEmail(email);
		
		// Debounce the API call
		const timeoutId = setTimeout(() => {
			fetchEmailSuggestions(email);
		}, 300);

		return () => clearTimeout(timeoutId);
	};

	const selectEmailSuggestion = (email: string) => {
		setSignersEmail(email);
		setShowEmailSuggestions(false);
		setEmailSuggestions([]);
	};

	const sendForSignature = async () => {
		const validation = validate();
		if (!validation.isValid) {
			setValidationErrors(validation.errors);
			setWarning(validation.message || "Please fill in all required fields");
			setShowSendModal(false);
			return;
		}

		if (!draftId) {
			setWarning("Please save the draft first before sending for signature.");
			return;
		}

		if (!signersEmail.trim()) {
			setWarning("Please enter an email address for the signer.");
			return;
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(signersEmail.trim())) {
			setWarning("Please enter a valid email address.");
			return;
		}

		setSendingForSignature(true);
		setWarning("");
		try {
			const res = await fetch("/api/ndas/send", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ draftId, signerEmail: signersEmail.trim(), signerRole: "Party B" }),
			});
			const json = await res.json();
			if (!res.ok) throw new Error(json.error || "Failed to send for signature");
			
			// Show shareable link modal
			const fullLink = `${window.location.origin}/sign/${json.signRequest.token}`;
			setShareableLink(fullLink);
			setShowSendModal(false);
			setShowShareLinkModal(true);
			setSignersEmail("");
		} catch (e) {
			setWarning(e instanceof Error ? e.message : "Failed to send for signature");
		} finally {
			setSendingForSignature(false);
		}
	};

	const closePreview = () => {
		if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
		setPreviewUrl("");
		setShowPreview(false);
	};

	if (!isLoaded) return <div className="min-h-screen">Loading...</div>;
	if (!user) return <RedirectToSignIn />;

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
			<PublicToolbar />
			<div className="max-w-5xl mx-auto py-8 px-4">
				<div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
					{/* Header */}
					<div className="bg-white border-b border-gray-200 px-8 py-6">
						<div className="flex items-center gap-3">
							<div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-md">
								<svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
								</svg>
							</div>
							<div className="flex-1">
								<h1 className="text-2xl font-bold text-gray-900">
									{draftId ? "Edit NDA Draft" : "Create New NDA"}
								</h1>
								<p className="text-gray-600 text-sm">
									{draftId 
										? "Continue editing your Non-Disclosure Agreement" 
										: "Fill out the form below to generate your Non-Disclosure Agreement"}
								</p>
							</div>
							{draftId && (
								<div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full">
									<svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
									</svg>
									<span className="text-xs font-semibold text-blue-700">Editing Draft</span>
								</div>
							)}
						</div>
					</div>

					<div className="p-8">
						{loading && (
							<div className="flex items-center gap-2 text-sm text-blue-600 mb-4 bg-blue-50 px-4 py-3 rounded-lg">
								<svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
									<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
									<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
								Loading draft...
							</div>
						)}
						{warning && (
							warning === "Draft saved successfully." ? (
								<div className="flex items-center gap-2 text-sm text-green-700 mb-4 bg-green-50 px-4 py-3 rounded-lg border border-green-200">
									<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
									{warning}
								</div>
							) : (
								<div className="flex items-center gap-2 text-sm text-red-700 mb-4 bg-red-50 px-4 py-3 rounded-lg border border-red-200">
									<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
										<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
									</svg>
									{warning}
								</div>
							)
						)}

						<div>
							{/* Progress Section */}
							<div className="mb-8">
								<div className="mb-6">
									<div className="flex justify-between items-center mb-2">
										<span className="text-sm font-medium text-gray-700">Progress</span>
										<span className="text-sm font-semibold text-blue-600">{computeCompletionPercent()}%</span>
									</div>
									<div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
										<div 
											className="h-3 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out rounded-full" 
											style={{ width: `${computeCompletionPercent()}%` }} 
										/>
									</div>
								</div>

								{/* Step Navigation */}
								<div className="flex items-center justify-between gap-2">
									{steps.map((s, i) => (
										<div key={s} className="flex-1 relative">
											<button 
												onClick={() => goToStep(i)} 
												className={`w-full transition-all duration-300 ${i === step ? 'transform scale-105' : ''}`}
											>
												<div className="flex flex-col items-center">
													<div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${
														i === step 
															? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg ring-4 ring-blue-100' 
															: isStepComplete(i)
															? 'bg-green-500 text-white shadow-md'
															: 'bg-gray-200 text-gray-500'
													}`}>
														{isStepComplete(i) ? (
															<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
																<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
															</svg>
														) : (
															<span className="font-bold">{i + 1}</span>
														)}
													</div>
													<span className={`text-xs font-medium text-center transition-all duration-300 ${
														i === step ? 'text-blue-600 font-semibold' : 'text-gray-500'
													}`}>
														{s}
													</span>
												</div>
											</button>
											{i < steps.length - 1 && (
												<div className="absolute top-6 left-[calc(50%+24px)] right-[calc(-50%+24px)] h-0.5 bg-gray-200 -z-10">
													<div 
														className={`h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ${
															isStepComplete(i) ? 'w-full' : 'w-0'
														}`}
													/>
												</div>
											)}
										</div>
									))}
								</div>
							</div>

							{/* Form Content */}
							<div className="bg-gray-50 rounded-xl p-6 min-h-[400px] border border-gray-200">
								{step === 0 && (
									<div className="space-y-6">
										<div className="flex items-center gap-3 mb-6">
											<div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
												<svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
												</svg>
											</div>
											<div>
												<h2 className="text-xl font-bold text-gray-800">Document Details</h2>
												<p className="text-sm text-gray-600">Basic information about your NDA</p>
											</div>
										</div>

										<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
											<div className="md:col-span-2">
												<label className="block text-sm font-semibold text-gray-700 mb-2">Document Title *</label>
												<input 
													className={`${getFieldClass("docName")} w-full rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`} 
													value={values.docName} 
													onChange={(e) => setField("docName", e.target.value)} 
													placeholder="e.g., Partnership NDA 2025" 
												/>
											</div>
											<div>
												<label className="block text-sm font-semibold text-gray-700 mb-2">Effective Date <span className="text-gray-700">*</span></label>
												<input 
													type="date" 
													className={`${getFieldClass("effective_date", "p-3 border w-full rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all")}`} 
													value={values.effective_date} 
													onChange={(e) => setField("effective_date", e.target.value)} 
													required
												/>
												<div className="text-xs text-gray-500 mt-1">DD/MM/YYYY</div>
											</div>
											<div>
												<label className="block text-sm font-semibold text-gray-700 mb-2">Term (months) *</label>
												<input 
													type="number"
													className={`${getFieldClass("term_months")} w-full rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`} 
													value={values.term_months} 
													onChange={(e) => setField("term_months", e.target.value)} 
													placeholder="e.g., 12" 
												/>
											</div>
											<div>
												<label className="block text-sm font-semibold text-gray-700 mb-2">Confidentiality Period (months) *</label>
												<input 
													type="number"
													className={`${getFieldClass("confidentiality_period_months")} w-full rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`} 
													value={values.confidentiality_period_months} 
													onChange={(e) => setField("confidentiality_period_months", e.target.value)} 
													placeholder="e.g., 24" 
												/>
											</div>
										</div>
									</div>
								)}

								{step === 1 && (
									<div className="space-y-6">
										<div className="flex items-center gap-3 mb-6">
											<div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
												<svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
												</svg>
											</div>
											<div className="flex-1">
												<h2 className="text-xl font-bold text-gray-800">Party A Information</h2>
												<p className="text-sm text-gray-600">Details of the first party</p>
											</div>
										</div>

										<div className="space-y-4">
											<div>
												<label className="block text-sm font-semibold text-gray-700 mb-2">Party Name *</label>
												<input 
													className={`${getFieldClass("party_a_name", "p-3 border")} w-full rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed`} 
													value={values.party_a_name} 
													onChange={(e) => setField("party_a_name", e.target.value)} 
													placeholder="Enter party name" 
													disabled={values.party_a_ask_receiver_fill} 
												/>
											</div>
											<div>
												<label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
												<textarea 
													className="p-3 border border-gray-300 w-full rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed" 
													rows={3}
													value={values.party_a_address} 
													onChange={(e) => setField("party_a_address", e.target.value)} 
													placeholder="Enter full address" 
													disabled={values.party_a_ask_receiver_fill} 
												/>
											</div>
											<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
												<div>
													<label className="block text-sm font-semibold text-gray-700 mb-2">Signatory Name</label>
													<input 
														className="p-3 border border-gray-300 w-full rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed" 
														value={values.party_a_signatory_name} 
														onChange={(e) => setField("party_a_signatory_name", e.target.value)} 
														placeholder="Full name" 
														disabled={values.party_a_ask_receiver_fill} 
													/>
												</div>
												<div>
													<label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
													<input 
														className="p-3 border border-gray-300 w-full rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed" 
														value={values.party_a_title} 
														onChange={(e) => setField("party_a_title", e.target.value)} 
														placeholder="e.g., CEO, Director" 
														disabled={values.party_a_ask_receiver_fill} 
													/>
												</div>
											</div>
										</div>
									</div>
								)}

								{step === 2 && (
									<div className="space-y-6">
										<div className="flex items-center gap-3 mb-6">
											<div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
												<svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
												</svg>
											</div>
											<div className="flex-1">
												<h2 className="text-xl font-bold text-gray-800">Party B Information</h2>
												<p className="text-sm text-gray-600">Details of the second party</p>
											</div>
											<label className="flex items-center gap-2 text-sm bg-blue-50 px-4 py-2 rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors">
												<input 
													type="checkbox" 
													checked={values.party_b_ask_receiver_fill} 
													onChange={(e) => setField("party_b_ask_receiver_fill", e.target.checked)} 
													className="form-checkbox h-4 w-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" 
												/>
												<span className="font-medium text-blue-700">Ask receiver to fill</span>
											</label>
										</div>

										<div className="space-y-4">
											<div>
												<label className="block text-sm font-semibold text-gray-700 mb-2">Party Name *</label>
												<input 
													className={`${getFieldClass("party_b_name", "p-3 border")} w-full rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed`} 
													value={values.party_b_name} 
													onChange={(e) => setField("party_b_name", e.target.value)} 
													placeholder="Enter party name" 
													disabled={values.party_b_ask_receiver_fill} 
												/>
											</div>
											<div>
												<label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
												<textarea 
													className="p-3 border border-gray-300 w-full rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed" 
													rows={3}
													value={values.party_b_address} 
													onChange={(e) => setField("party_b_address", e.target.value)} 
													placeholder="Enter full address" 
													disabled={values.party_b_ask_receiver_fill} 
												/>
											</div>
											<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
												<div>
													<label className="block text-sm font-semibold text-gray-700 mb-2">Signatory Name</label>
													<input 
														className="p-3 border border-gray-300 w-full rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed" 
														value={values.party_b_signatory_name} 
														onChange={(e) => setField("party_b_signatory_name", e.target.value)} 
														placeholder="Full name" 
														disabled={values.party_b_ask_receiver_fill} 
													/>
												</div>
												<div>
													<label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
													<input 
														className="p-3 border border-gray-300 w-full rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed" 
														value={values.party_b_title} 
														onChange={(e) => setField("party_b_title", e.target.value)} 
														placeholder="e.g., CEO, Director" 
														disabled={values.party_b_ask_receiver_fill} 
													/>
												</div>
											</div>
											<div>
												<label className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
												<input 
													type="email"
													className={`${getFieldClass("party_b_email", "p-3 border")} w-full rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed`} 
													value={values.party_b_email} 
													onChange={(e) => setField("party_b_email", e.target.value)} 
													placeholder="email@example.com" 
													disabled={values.party_b_ask_receiver_fill} 
												/>
											</div>
										</div>
									</div>
								)}

								{step === 3 && (
									<div className="space-y-6">
										<div className="flex items-center gap-3 mb-6">
											<div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
												<svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
												</svg>
											</div>
											<div>
												<h2 className="text-xl font-bold text-gray-800">Additional Clauses</h2>
												<p className="text-sm text-gray-600">Customize your agreement terms</p>
											</div>
										</div>

										<div className="space-y-4">
											<div>
												<label className="block text-sm font-semibold text-gray-700 mb-2">Governing Law</label>
												<input 
													className="p-3 border border-gray-300 w-full rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" 
													value={values.governing_law} 
													onChange={(e) => setField("governing_law", e.target.value)} 
													placeholder="e.g., State of California" 
												/>
											</div>
											<div>
												<label className="block text-sm font-semibold text-gray-700 mb-2">IP Ownership Clause</label>
												<textarea 
													className="p-3 border border-gray-300 w-full rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" 
													rows={3}
													value={values.ip_ownership} 
													onChange={(e) => setField("ip_ownership", e.target.value)} 
													placeholder="Specify intellectual property ownership terms..." 
												/>
											</div>
											<div>
												<label className="block text-sm font-semibold text-gray-700 mb-2">Non-Solicitation Clause</label>
												<textarea 
													className="p-3 border border-gray-300 w-full rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" 
													rows={3}
													value={values.non_solicit} 
													onChange={(e) => setField("non_solicit", e.target.value)} 
													placeholder="Define non-solicitation terms..." 
												/>
											</div>
											<div>
												<label className="block text-sm font-semibold text-gray-700 mb-2">Exclusivity Clause</label>
												<textarea 
													className="p-3 border border-gray-300 w-full rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" 
													rows={3}
													value={values.exclusivity} 
													onChange={(e) => setField("exclusivity", e.target.value)} 
													placeholder="Specify exclusivity arrangements..." 
												/>
											</div>
										</div>
									</div>
								)}

								{step === 4 && (
									<div className="space-y-6">
										<div className="flex items-center gap-3 mb-6">
											<div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
												<svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
												</svg>
											</div>
											<div>
												<h2 className="text-xl font-bold text-gray-800">Review Your NDA</h2>
												<p className="text-sm text-gray-600">Check all details before proceeding</p>
											</div>
										</div>

										<div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
											<div className="p-4 hover:bg-gray-50 transition-colors">
												<div className="flex items-start justify-between">
													<div className="flex-1">
														<div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Document Name</div>
														<div className="text-base font-medium text-gray-900">{values.docName || <span className="text-gray-400 italic">Not provided</span>}</div>
													</div>
													<button onClick={() => goToStep(0)} className="text-blue-600 hover:text-blue-700 text-sm font-medium">Edit</button>
												</div>
											</div>
											<div className="p-4 hover:bg-gray-50 transition-colors">
												<div className="flex items-start justify-between">
													<div className="flex-1 grid grid-cols-3 gap-4">
														<div>
															<div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Effective Date</div>
															<div className="text-base font-medium text-gray-900">{values.effective_date || <span className="text-gray-400 italic">Not set</span>}</div>
														</div>
														<div>
															<div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Term</div>
															<div className="text-base font-medium text-gray-900">{values.term_months ? `${values.term_months} months` : <span className="text-gray-400 italic">Not set</span>}</div>
														</div>
														<div>
															<div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Confidentiality Period</div>
															<div className="text-base font-medium text-gray-900">{values.confidentiality_period_months ? `${values.confidentiality_period_months} months` : <span className="text-gray-400 italic">Not set</span>}</div>
														</div>
													</div>
													<button onClick={() => goToStep(0)} className="text-blue-600 hover:text-blue-700 text-sm font-medium ml-4">Edit</button>
												</div>
											</div>
											<div className="p-4 hover:bg-gray-50 transition-colors">
												<div className="flex items-start justify-between">
													<div className="flex-1">
														<div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Party A</div>
														<div className="text-base font-medium text-gray-900">
															{values.party_a_name || <span className="text-gray-400 italic">Not provided</span>}
															{values.party_a_ask_receiver_fill && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Receiver will fill</span>}
														</div>
													</div>
													<button onClick={() => goToStep(1)} className="text-blue-600 hover:text-blue-700 text-sm font-medium">Edit</button>
												</div>
											</div>
											<div className="p-4 hover:bg-gray-50 transition-colors">
												<div className="flex items-start justify-between">
													<div className="flex-1">
														<div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Party B</div>
														<div className="text-base font-medium text-gray-900">
															{values.party_b_name || <span className="text-gray-400 italic">Not provided</span>}
															{values.party_b_ask_receiver_fill && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Receiver will fill</span>}
														</div>
														<div className="text-sm text-gray-600 mt-1">{values.party_b_email || <span className="text-gray-400 italic">No email</span>}</div>
													</div>
													<button onClick={() => goToStep(2)} className="text-blue-600 hover:text-blue-700 text-sm font-medium">Edit</button>
												</div>
											</div>
										</div>
									</div>
								)}
							</div>

							{/* Navigation Buttons */}
							<div className="mt-8 flex items-center justify-between gap-4 pt-6 border-t border-gray-200">
								<div className="flex gap-3">
									<button 
										onClick={goBack} 
										disabled={step === 0} 
										className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
											step === 0 
												? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
												: 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:shadow-md'
										}`}
									>
										<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
										</svg>
										Back
									</button>
									{step < steps.length - 1 && (
										<button 
											onClick={goNext} 
											className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
										>
											Next
											<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
											</svg>
										</button>
									)}
									{step === steps.length - 1 && (
										<>
											<button 
												onClick={preview} 
												className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
											>
												<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
												</svg>
												Preview Document
											</button>
											{draftId && (
												<button 
													onClick={() => setShowSendModal(true)} 
													className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
												>
													<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
													</svg>
													Send for Signature
												</button>
											)}
										</>
									)}
								</div>
								<div className="flex gap-3">
									<button 
										onClick={saveDraft} 
										disabled={saving} 
										className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 ${
											saving 
												? 'bg-gray-400 text-white cursor-not-allowed' 
												: 'bg-purple-600 text-white hover:bg-purple-700'
										}`}
									>
										<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
										</svg>
										{saving ? "Saving..." : "Save Draft"}
									</button>
									<button 
										onClick={() => setShowExitWarningModal(true)} 
										className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-all duration-200 hover:shadow-md flex items-center gap-2"
									>
										<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
										</svg>
										Cancel
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Preview Modal */}
			{showPreview && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4 animate-fadeIn">
					<div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full relative flex flex-col overflow-hidden" style={{ height: '90vh' }}>
						<div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
									<svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
									</svg>
								</div>
								<div>
									<h2 className="text-xl font-bold text-gray-800">PDF Preview</h2>
									<p className="text-sm text-gray-600">Review your document before sending</p>
								</div>
							</div>
							<button 
								className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg" 
								onClick={closePreview} 
								aria-label="Close preview"
							>
								<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>
						<div className="flex-1 overflow-hidden">
							{previewUrl && (
								<PDFPreview 
									base64={previewUrl} 
									showFullViewer={true}
									className="w-full h-full"
								/>
							)}
						</div>
						<div className="flex gap-3 justify-end p-6 border-t border-gray-200 bg-gray-50">
							<button 
								onClick={closePreview}
								className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-all duration-200"
							>
								Close
							</button>
							<button 
								onClick={() => {
									const link = document.createElement('a');
									link.href = previewUrl;
									link.download = values.docName ? `${values.docName}.pdf` : 'NDA.pdf';
									document.body.appendChild(link);
									link.click();
									document.body.removeChild(link);
								}}
								className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
							>
								<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
								</svg>
								Download PDF
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Send for Signature Modal */}
			{showSendModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4 animate-fadeIn">
					<div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
						<div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-gray-200">
							<div className="flex items-center gap-3 mb-2">
								<div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
									<svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
									</svg>
								</div>
								<div className="flex-1">
									<h2 className="text-xl font-bold text-gray-800">Send for Signature</h2>
									<p className="text-sm text-gray-600">Ready to send your NDA?</p>
								</div>
								<button 
									className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-white hover:bg-opacity-50 rounded-lg" 
									onClick={() => setShowSendModal(false)} 
									aria-label="Close modal"
								>
									<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							</div>
						</div>
						<div className="p-6">
							<div className="mb-6">
								<label className="block text-sm font-semibold text-gray-700 mb-2">Signer&apos;s Email Address</label>
								<div className="relative">
									<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
										<svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
										</svg>
									</div>
									<input 
										type="email"
										value={signersEmail} 
										onChange={(e) => {
											const value = e.target.value;
											handleEmailChange(value);
										}}
										onFocus={() => {
											if (signersEmail.length >= 2) {
												fetchEmailSuggestions(signersEmail);
											}
										}}
										onBlur={() => {
											// Delay hiding to allow click on suggestion
											setTimeout(() => setShowEmailSuggestions(false), 200);
										}}
										className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all" 
										placeholder="signer@example.com"
										autoFocus
										autoComplete="off"
									/>
									
									{/* Email Suggestions Dropdown */}
									{showEmailSuggestions && emailSuggestions.length > 0 && (
										<div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-y-auto">
											{emailSuggestions.map((suggestion, index) => (
												<button
													key={index}
													type="button"
													onClick={() => selectEmailSuggestion(suggestion.email)}
													className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 flex items-start gap-3"
												>
													<div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
														{suggestion.email.charAt(0).toUpperCase()}
													</div>
													<div className="flex-1 min-w-0">
														<div className="font-medium text-gray-900 truncate">
															{suggestion.email}
														</div>
														<div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2 flex-wrap">
															<span className="flex items-center gap-1">
																<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																	<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
																</svg>
																{suggestion.count} {suggestion.count === 1 ? 'NDA' : 'NDAs'}
															</span>
															{suggestion.hasSignedBefore && (
																<span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
																	<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
																	</svg>
																	Signed before
																</span>
															)}
														</div>
														{suggestion.recentNda && (
															<div className="text-xs text-gray-400 mt-1 truncate">
																Recent: {suggestion.recentNda}
															</div>
														)}
													</div>
												</button>
											))}
										</div>
									)}
									
									{loadingSuggestions && (
										<div className="absolute right-3 top-1/2 -translate-y-1/2">
											<svg className="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
												<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
												<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
											</svg>
										</div>
									)}
								</div>
								<p className="mt-2 text-xs text-gray-500">The recipient will receive an email with a link to sign the document</p>
							</div>
							<div className="flex gap-3 justify-end">
								<button 
									onClick={() => setShowSendModal(false)} 
									className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-all duration-200"
								>
									Cancel
								</button>
								<button 
									onClick={sendForSignature} 
									disabled={sendingForSignature || !signersEmail} 
									className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
										sendingForSignature || !signersEmail
											? 'bg-gray-400 text-white cursor-not-allowed' 
											: 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-md hover:shadow-lg'
									}`}
								>
									{sendingForSignature ? (
										<>
											<svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
												<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
												<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
											</svg>
											Sending...
										</>
									) : (
										<>
											<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
											</svg>
											Send Now
										</>
									)}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Save Confirmation Modal */}
			{showSaveConfirmModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4 animate-fadeIn">
					<div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
						<div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-6 border-b border-gray-200">
							<div className="flex items-center gap-3 mb-2">
								<div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
									<svg className="w-7 h-7 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
									</svg>
								</div>
								<div className="flex-1">
									<h2 className="text-xl font-bold text-gray-800">Save Changes?</h2>
									<p className="text-sm text-gray-600">This will overwrite existing data</p>
								</div>
								<button 
									className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-white hover:bg-opacity-50 rounded-lg" 
									onClick={() => setShowSaveConfirmModal(false)} 
									aria-label="Close modal"
								>
									<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							</div>
						</div>
						<div className="p-6">
							<div className="mb-6">
								<p className="text-gray-700 mb-2">
									Are you sure you want to save changes? This will overwrite the saved data for:
								</p>
								<div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
									<p className="font-semibold text-gray-900">{values.docName || "Untitled NDA"}</p>
								</div>
								<p className="mt-3 text-sm text-gray-500">
									This action cannot be undone. The previous version will be permanently replaced.
								</p>
							</div>
							<div className="flex gap-3 justify-end">
								<button 
									onClick={() => setShowSaveConfirmModal(false)} 
									className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-all duration-200"
								>
									Cancel
								</button>
								<button 
									onClick={performSave} 
									disabled={saving} 
									className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
										saving
											? 'bg-gray-400 text-white cursor-not-allowed' 
											: 'bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-700 hover:to-red-700 shadow-md hover:shadow-lg'
									}`}
								>
									{saving ? (
										<>
											<svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
												<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
												<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
											</svg>
											Saving...
										</>
									) : (
										<>
											<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
											</svg>
											Save Changes
										</>
									)}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Shareable Link Modal */}
			{showShareLinkModal && (
				<div 
					className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4 animate-fadeIn"
					onClick={(e) => {
						// Close modal when clicking on backdrop
						if (e.target === e.currentTarget) {
							setShowShareLinkModal(false);
							router.push("/mydrafts");
						}
					}}
				>
					<div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden relative">
						{/* Close X Button - Top Right - HIGHLY VISIBLE */}
						<button 
							className="absolute top-3 right-3 z-50 bg-red-500 text-white hover:bg-red-600 transition-all p-2.5 rounded-full shadow-xl border-2 border-white hover:scale-110" 
							onClick={() => {
								setShowShareLinkModal(false);
								router.push("/mydrafts");
							}} 
							aria-label="Close modal"
							title="Close"
						>
							<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
								<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
						
						<div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 border-b border-gray-200">
							<div className="flex items-center gap-3 mb-2">
								<div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
									<svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
								</div>
								<div className="flex-1">
									<h2 className="text-xl font-bold text-gray-800">NDA Ready to Share!</h2>
									<p className="text-sm text-gray-600">Share this link with the recipient</p>
								</div>
							</div>
						</div>
						<div className="p-6">
							{/* Email Sent Success Message */}
							<div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
								<svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
								</svg>
								<div>
									<p className="font-semibold text-green-800 mb-1">✅ NDA Ready to Share!</p>
									<p className="text-sm text-green-700">Share the link below with <strong>{signersEmail}</strong> to review and sign.</p>
								</div>
							</div>
							
							<div className="mb-6">
								<p className="text-gray-700 mb-4">
									The recipient can use this link to review, fill their details, make changes if needed, and sign the NDA.
								</p>
								
								{/* Shareable Link */}
								<div className="bg-gray-50 rounded-lg p-4 border-2 border-blue-200">
									<label className="block text-sm font-semibold text-gray-700 mb-2">Shareable Link</label>
									<div className="flex gap-2">
										<input 
											type="text"
											value={shareableLink}
											readOnly
											className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-lg font-mono text-sm text-gray-700"
											onClick={(e) => e.currentTarget.select()}
										/>
										<button
											onClick={() => {
												navigator.clipboard.writeText(shareableLink);
												setWarning("Link copied to clipboard!");
												setTimeout(() => setWarning(""), 2000);
											}}
											className="px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
										>
											<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
											</svg>
											Copy
										</button>
									</div>
								</div>

								{/* Share Options */}
								<div className="mt-6">
									<p className="text-sm font-semibold text-gray-700 mb-3">Or share via:</p>
									<div className="grid grid-cols-2 gap-3">
										<a
											href={`mailto:${signersEmail}?subject=Please review and sign our NDA&body=Hi,%0D%0A%0D%0APlease review and sign our Non-Disclosure Agreement using this link:%0D%0A${encodeURIComponent(shareableLink)}%0D%0A%0D%0AYou can review all details, make changes if needed, and sign electronically.%0D%0A%0D%0AThank you!`}
											className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors border border-gray-300"
										>
											<svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
											</svg>
											<span className="font-medium text-gray-700">Email</span>
										</a>
										<a
											href={`https://wa.me/?text=${encodeURIComponent(`Please review and sign our NDA: ${shareableLink}`)}`}
											target="_blank"
											rel="noopener noreferrer"
											className="flex items-center justify-center gap-2 px-4 py-3 bg-green-100 hover:bg-green-200 rounded-lg transition-colors border border-green-300"
										>
											<svg className="w-5 h-5 text-green-700" fill="currentColor" viewBox="0 0 24 24">
												<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
											</svg>
											<span className="font-medium text-green-700">WhatsApp</span>
										</a>
										<a
											href={`https://t.me/share/url?url=${encodeURIComponent(shareableLink)}&text=${encodeURIComponent('Please review and sign our NDA')}`}
											target="_blank"
											rel="noopener noreferrer"
											className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors border border-blue-300"
										>
											<svg className="w-5 h-5 text-blue-700" fill="currentColor" viewBox="0 0 24 24">
												<path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
											</svg>
											<span className="font-medium text-blue-700">Telegram</span>
										</a>
										<button
											onClick={() => {
												const shareData = {
													title: 'NDA Signature Request',
													text: 'Please review and sign our NDA',
													url: shareableLink
												};
												if (navigator.share) {
													navigator.share(shareData).catch(() => {});
												} else {
													navigator.clipboard.writeText(shareableLink);
													setWarning("Link copied!");
													setTimeout(() => setWarning(""), 2000);
												}
											}}
											className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-100 hover:bg-purple-200 rounded-lg transition-colors border border-purple-300"
										>
											<svg className="w-5 h-5 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
											</svg>
											<span className="font-medium text-purple-700">More</span>
										</button>
									</div>
								</div>

								<div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
									<div className="flex gap-3">
										<svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
										<div className="text-sm text-blue-800">
											<p className="font-semibold mb-1">What the recipient can do:</p>
											<ul className="list-disc list-inside space-y-1 text-blue-700">
												<li>Review all NDA terms and details</li>
												<li>Fill in their party information</li>
												<li>Make changes or suggestions to any fields</li>
												<li>Sign electronically when ready</li>
											</ul>
										</div>
									</div>
								</div>
							</div>
							
							<div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
								<button 
									onClick={() => {
										setShowShareLinkModal(false);
										router.push("/mydrafts");
									}} 
									className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
								>
									<span>Close & Go to My Drafts</span>
									<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
									</svg>
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Exit Warning Modal */}
			{showExitWarningModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4 animate-fadeIn">
					<div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
						<div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 border-b border-gray-200">
							<div className="flex items-center gap-3 mb-2">
								<div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
									<svg className="w-7 h-7 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
									</svg>
								</div>
								<div className="flex-1">
									<h2 className="text-xl font-bold text-gray-800">Save Changes?</h2>
									<p className="text-sm text-gray-600">You have unsaved changes</p>
								</div>
								<button 
									className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-white hover:bg-opacity-50 rounded-lg" 
									onClick={() => setShowExitWarningModal(false)} 
									aria-label="Close modal"
								>
									<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							</div>
						</div>
						<div className="p-6">
							<div className="mb-6">
								<p className="text-gray-700 mb-3">
									Are you sure you want to exit? Any unsaved data will be deleted.
								</p>
								<div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
									<p className="text-sm text-orange-800">
										<strong>Warning:</strong> All your changes will be lost if you don&apos;t save them first.
									</p>
								</div>
							</div>
							<div className="flex gap-3 justify-end flex-wrap">
								<button 
									onClick={() => setShowExitWarningModal(false)} 
									className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-all duration-200"
								>
									Stay & Continue Editing
								</button>
								<button 
									onClick={async () => {
										setShowExitWarningModal(false);
										await saveDraft();
										setTimeout(() => router.push('/dashboard'), 500);
									}} 
									className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-200 flex items-center gap-2"
								>
									<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
									</svg>
									Save & Exit
								</button>
								<button 
									onClick={() => {
										setShowExitWarningModal(false);
										router.push('/dashboard');
									}} 
									className="px-5 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all duration-200 flex items-center gap-2"
								>
									<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
									</svg>
									Exit Without Saving
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

