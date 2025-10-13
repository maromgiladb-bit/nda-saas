"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser, RedirectToSignIn } from "@clerk/nextjs";
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

export default function FillNDA() {
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
	const [validationErrors, setValidationErrors] = useState<Set<string>>(new Set());
	const [step, setStep] = useState<number>(0);

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
		if (urlDraftId) loadDraft(urlDraftId);
		else {
			const d = localStorage.getItem("fillndaDraft");
			if (d) {
				try {
					const parsed = JSON.parse(d);
					setValues({ ...DEFAULTS, ...(parsed.values || {}) });
					setDraftId(parsed.draftId || null);
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

		if (!values.party_b_email || !values.party_b_email.includes("@")) {
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
				stepFields.push("party_a_name", "party_a_address", "party_a_signatory_name", "party_a_title");
				break;
			case 2:
				stepFields.push("party_b_name", "party_b_address", "party_b_signatory_name", "party_b_title", "party_b_email");
				break;
			case 3:
				// Clauses considered complete if present (but mandatory globally)
				stepFields.push("governing_law", "ip_ownership", "non_solicit", "exclusivity");
				break;
			case 4:
				// review - all mandatory fields
				stepFields.push(
					"docName",
					"effective_date",
					"term_months",
					"confidentiality_period_months",
					"party_a_name",
					"party_b_name",
					"party_b_email",
				);
				break;
			default:
				return false;
		}

		for (const field of stepFields) {
			const val = values[field as keyof FormValues];
			if (!val || (typeof val === "string" && !val.trim())) return false;
			if (field === "party_b_email" && !values.party_b_email.includes("@")) return false;
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
		setSaving(true);
		setWarning("");
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
			return;
		}
		setValidationErrors(new Set());
		setWarning("");
		try {
			const res = await fetch("/api/ndas/preview", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ ...values, templatePdf: "/pdfs/nda-for-pagefill.pdf", draftId }),
			});
			const json = await res.json();
			if (!res.ok) throw new Error(json.error || "Preview failed");
			if (!json.fileUrl || !json.fileUrl.startsWith("data:application/pdf;base64,")) throw new Error("Invalid PDF data received");
			const base64Data = json.fileUrl.split(",")[1];
			const binaryString = atob(base64Data);
			const bytes = new Uint8Array(binaryString.length);
			for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
			const blob = new Blob([bytes], { type: "application/pdf" });
			const blobUrl = URL.createObjectURL(blob);
			setPreviewUrl(blobUrl);
			setShowPreview(true);
		} catch (e) {
			setWarning(e instanceof Error ? e.message : "Preview failed");
		}
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
			setShowSendModal(false);
			setSignersEmail("");
			setWarning(`NDA sent for signature to ${signersEmail}`);
			setTimeout(() => router.push("/mydrafts"), 1500);
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
		<div className="min-h-screen bg-gray-50">
			<PublicToolbar />
			<div className="max-w-4xl mx-auto py-8 px-4">
				<div className="bg-white shadow rounded-lg p-6">
					<h1 className="text-2xl font-bold mb-4">Fill NDA (Form)</h1>
					{loading && <div className="text-sm text-gray-600 mb-2">Loading draft...</div>}
					{warning && <div className="text-sm text-red-600 mb-3">{warning}</div>}

					<div>
						<div className="mb-4">
							<div className="mb-2">
								<div className="w-full bg-gray-200 rounded h-2 overflow-hidden">
									<div className="h-2 bg-blue-500 transition-all duration-300" style={{ width: `${computeCompletionPercent()}%` }} />
								</div>
								<div className="text-xs text-gray-600 mt-1">{computeCompletionPercent()}% complete</div>
							</div>
							<div className="flex items-center gap-2">
								{steps.map((s, i) => (
									<button key={s} onClick={() => goToStep(i)} className="flex-1 text-left">
										<div className="flex items-center justify-between">
											<div className={`text-sm ${i === step ? "font-semibold" : "text-gray-500"} flex items-center gap-2`}>
												{s}
												<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 text-blue-500 transition-opacity duration-300 ${isStepComplete(i) ? "opacity-100" : "opacity-0"}`} aria-hidden>
													<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15l-4.121-4.121a1 1 0 011.414-1.414L8.414 12.172l7.879-7.879a1 1 0 011.414 0z" clipRule="evenodd" />
												</svg>
											</div>
										</div>
										<div className={`h-1 mt-1 rounded transition-colors duration-300 ${isStepComplete(i) ? "bg-blue-500" : "bg-gray-200"}`} style={{ width: "100%" }} />
									</button>
								))}
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{step === 0 && (
								<>
									<input className={getFieldClass("docName")} value={values.docName} onChange={(e) => setField("docName", e.target.value)} placeholder="Document Name *" />
									<input type="date" className="p-2 border border-gray-300" value={values.effective_date} onChange={(e) => setField("effective_date", e.target.value)} />
									<input className={getFieldClass("term_months")} value={values.term_months} onChange={(e) => setField("term_months", e.target.value)} placeholder="Term (months) *" />
									<input className={getFieldClass("confidentiality_period_months")} value={values.confidentiality_period_months} onChange={(e) => setField("confidentiality_period_months", e.target.value)} placeholder="Confidentiality period (months) *" />
								</>
							)}

							{step === 1 && (
								<div className="col-span-1 md:col-span-2">
									<div className="flex items-center justify-between">
										<h3 className="font-semibold">Party A</h3>
										<label className="flex items-center gap-2 text-sm">
											<input type="checkbox" checked={values.party_a_ask_receiver_fill} onChange={(e) => setField("party_a_ask_receiver_fill", e.target.checked)} className="form-checkbox h-4 w-4" />
											Ask the receiver to fill
										</label>
									</div>
									<input className={getFieldClass("party_a_name", "p-2 border w-full mb-2")} value={values.party_a_name} onChange={(e) => setField("party_a_name", e.target.value)} placeholder="Party A name *" disabled={values.party_a_ask_receiver_fill} />
									<textarea className="p-2 border border-gray-300 w-full mb-2" value={values.party_a_address} onChange={(e) => setField("party_a_address", e.target.value)} placeholder="Party A address" disabled={values.party_a_ask_receiver_fill} />
									<div className="grid grid-cols-2 gap-2">
										<input className="p-2 border border-gray-300" value={values.party_a_signatory_name} onChange={(e) => setField("party_a_signatory_name", e.target.value)} placeholder="Signatory name" disabled={values.party_a_ask_receiver_fill} />
										<input className="p-2 border border-gray-300" value={values.party_a_title} onChange={(e) => setField("party_a_title", e.target.value)} placeholder="Title" disabled={values.party_a_ask_receiver_fill} />
									</div>
								</div>
							)}

							{step === 2 && (
								<div className="col-span-1 md:col-span-2">
									<div className="flex items-center justify-between">
										<h3 className="font-semibold">Party B</h3>
										<label className="flex items-center gap-2 text-sm">
											<input type="checkbox" checked={values.party_b_ask_receiver_fill} onChange={(e) => setField("party_b_ask_receiver_fill", e.target.checked)} className="form-checkbox h-4 w-4" />
											Ask the receiver to fill
										</label>
									</div>
									<input className={getFieldClass("party_b_name", "p-2 border w-full mb-2")} value={values.party_b_name} onChange={(e) => setField("party_b_name", e.target.value)} placeholder="Party B name *" disabled={values.party_b_ask_receiver_fill} />
									<textarea className="p-2 border border-gray-300 w-full mb-2" value={values.party_b_address} onChange={(e) => setField("party_b_address", e.target.value)} placeholder="Party B address" disabled={values.party_b_ask_receiver_fill} />
									<div className="grid grid-cols-2 gap-2">
										<input className="p-2 border border-gray-300" value={values.party_b_signatory_name} onChange={(e) => setField("party_b_signatory_name", e.target.value)} placeholder="Signatory name" disabled={values.party_b_ask_receiver_fill} />
										<input className="p-2 border border-gray-300" value={values.party_b_title} onChange={(e) => setField("party_b_title", e.target.value)} placeholder="Title" disabled={values.party_b_ask_receiver_fill} />
									</div>
									<input className={getFieldClass("party_b_email", "p-2 border w-full mt-2")} value={values.party_b_email} onChange={(e) => setField("party_b_email", e.target.value)} placeholder="Email *" disabled={values.party_b_ask_receiver_fill} />
								</div>
							)}

							{step === 3 && (
								<>
									<input className="p-2 border border-gray-300 col-span-1 md:col-span-2" value={values.governing_law} onChange={(e) => setField("governing_law", e.target.value)} placeholder="Governing law" />
									<textarea className="p-2 border border-gray-300 col-span-1 md:col-span-2" value={values.ip_ownership} onChange={(e) => setField("ip_ownership", e.target.value)} placeholder="IP Ownership clause" />
									<textarea className="p-2 border border-gray-300 col-span-1 md:col-span-2" value={values.non_solicit} onChange={(e) => setField("non_solicit", e.target.value)} placeholder="Non-solicitation clause" />
									<textarea className="p-2 border border-gray-300 col-span-1 md:col-span-2" value={values.exclusivity} onChange={(e) => setField("exclusivity", e.target.value)} placeholder="Exclusivity clause" />
								</>
							)}

							{step === 4 && (
								<div className="col-span-1 md:col-span-2">
									<h3 className="font-semibold mb-2">Review</h3>
									<div className="space-y-2 text-sm text-gray-700">
										<div><strong>Document:</strong> {values.docName || <span className="text-gray-400">(empty)</span>}</div>
										<div><strong>Effective date:</strong> {values.effective_date}</div>
										<div><strong>Term (months):</strong> {values.term_months || <span className="text-gray-400">(empty)</span>}</div>
										<div><strong>Confidentiality period:</strong> {values.confidentiality_period_months || <span className="text-gray-400">(empty)</span>}</div>
										<div className="pt-2"><strong>Party A:</strong> {values.party_a_name || <span className="text-gray-400">(empty)</span>} {values.party_a_ask_receiver_fill && <span className="text-sm text-blue-600">(receiver will fill)</span>}</div>
										<div><strong>Party B:</strong> {values.party_b_name || <span className="text-gray-400">(empty)</span>} {values.party_b_ask_receiver_fill && <span className="text-sm text-blue-600">(receiver will fill)</span>}</div>
										<div><strong>Party B Email:</strong> {values.party_b_email || <span className="text-gray-400">(empty)</span>}</div>
									</div>
								</div>
							)}
						</div>

						<div className="mt-4 flex items-center justify-between">
							<div className="flex gap-3">
								<button onClick={goBack} disabled={step === 0} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Back</button>
								{step < steps.length - 1 && (
									<button onClick={goNext} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Next</button>
								)}
								{step === steps.length - 1 && (
									<>
										<button onClick={saveDraft} disabled={saving} className={`px-4 py-2 text-white rounded ${saving ? "bg-gray-400" : "bg-purple-600 hover:bg-purple-700"}`}>{saving ? "Saving..." : "Save Draft"}</button>
										<button onClick={preview} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Preview PDF</button>
										{draftId && (
											<button onClick={() => setShowSendModal(true)} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Send for Signature</button>
										)}
									</>
								)}
							</div>
							<div className="flex gap-3">
								<button onClick={saveDraft} disabled={saving} className={`px-4 py-2 text-white rounded ${saving ? "bg-gray-400" : "bg-purple-600 hover:bg-purple-700"}`}>
									{saving ? "Saving..." : "Save Draft"}
								</button>
								<button onClick={() => router.push('/dashboard')} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancel</button>
							</div>
						</div>
					</div>
				</div>
			</div>

			{showPreview && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
					<div className="bg-white rounded shadow-lg p-4 max-w-4xl w-full relative flex flex-col" style={{ height: '85vh' }}>
						<div className="flex justify-between items-center mb-4">
							<h2 className="text-lg font-semibold">Preview NDA</h2>
							<button className="text-gray-600 hover:text-black text-xl" onClick={closePreview} aria-label="Close preview">&times;</button>
						</div>
						<iframe src={`/pdfjs/web/viewer.html?file=${encodeURIComponent(previewUrl)}`} className="w-full flex-1 border rounded mb-4" style={{ height: '65vh' }} frameBorder="0" />
						<div className="flex gap-3 justify-end">
							<button onClick={() => window.open(previewUrl, '_blank')} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Open in New Tab</button>
							<button onClick={closePreview} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">Close</button>
						</div>
					</div>
				</div>
			)}

			{showSendModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
					<div className="bg-white rounded shadow-lg p-6 max-w-md w-full mx-4">
						<div className="flex justify-between items-center mb-4">
							<h2 className="text-lg font-semibold">Send for Signature</h2>
							<button className="text-gray-600 hover:text-black text-xl" onClick={() => setShowSendModal(false)} aria-label="Close modal">&times;</button>
						</div>
						<div className="mb-3">
							<label className="block text-sm mb-1">Signer email</label>
							<input value={signersEmail} onChange={(e) => setSignersEmail(e.target.value)} className="w-full p-2 border border-gray-300 rounded" placeholder="signer@example.com" />
						</div>
						<div className="flex gap-3 justify-end">
							<button onClick={() => setShowSendModal(false)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancel</button>
							<button onClick={sendForSignature} disabled={sendingForSignature} className={`px-4 py-2 text-white rounded ${sendingForSignature ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}>{sendingForSignature ? 'Sending...' : 'Send'}</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

