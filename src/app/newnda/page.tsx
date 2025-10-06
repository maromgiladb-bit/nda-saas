"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const PDF_PATH = "/pdfs/mutual-nda-v3-fillable.pdf";
const viewerSrc = `/pdfjs/web/viewer.html?file=${encodeURIComponent(PDF_PATH)}`;

export default function NewNDA() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [draftId, setDraftId] = useState("");
  const [lastSaved, setLastSaved] = useState("");
  const [warning, setWarning] = useState("");
  const [saving, setSaving] = useState(false);
  const [docName, setDocName] = useState("");
  const [counterpartyName, setCounterpartyName] = useState("");
  const [pdfLoaded, setPdfLoaded] = useState(false);

  // Prefer AcroForm field name (aria-label), then title, name, id. Never use data-annotation-id or fallback keys.
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  
  const resolveKey = useCallback((el: Element): string | null => {
    const e = el as HTMLElement;
    const aria = (e.getAttribute("aria-label") || "").trim();
    if (aria) return aria;
    const title = (e.getAttribute("title") || "").trim();
    if (title) return title;
    const nm = (e.getAttribute("name") || "").trim();
    if (nm) return nm;
    const id = (e.getAttribute("id") || "").trim();
    if (id) return id;
    return null;
  }, []);

  // Wait for fields in the iframe's contentDocument
  const waitForFields = useCallback(async (timeout = 12000): Promise<Document> => {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      function check() {
        const doc = iframeRef.current?.contentDocument;
        if (doc) {
          const widgets = doc.querySelectorAll("input, select, textarea");
          if (widgets.length > 0) return resolve(doc);
        }
        if (Date.now() - start > timeout) return reject(new Error("PDF fields not found"));
        setTimeout(check, 250);
      }
      check();
    });
  }, []);

  // Only collect fields with stable keys
  const collectFields = useCallback(async (): Promise<Record<string, string | boolean>> => {
    const doc = await waitForFields(12000);
    const out: Record<string, string | boolean> = {};
    const widgets = Array.from(doc.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input, select, textarea"));
    widgets.forEach((el) => {
      const key = resolveKey(el);
      if (!key) return;
      if (el instanceof HTMLInputElement && el.type === "checkbox") out[key] = el.checked;
      else out[key] = (el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value;
    });
    if (Object.keys(out).length === 0) throw new Error("No stable field names found (check aria-label/title in your PDF fields).");
    return out;
  }, [waitForFields, resolveKey]);

  const applyFields = useCallback(
    async (values: Record<string, string | boolean>) => {
      const doc = await waitForFields(12000);
      const widgets = Array.from(doc.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input, select, textarea"));
      widgets.forEach((el) => {
        const key = resolveKey(el);
        if (!key || !(key in values)) return;
        const v = values[key];
        if (el instanceof HTMLInputElement && el.type === "checkbox") el.checked = !!v;
        else (el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value = typeof v === "boolean" ? String(v) : v ?? "";
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      });
    },
    [waitForFields, resolveKey]
  );

  useEffect(() => {
    if (iframeRef.current) {
      console.log("Iframe src:", iframeRef.current.src);
      
      const checkPdfLoaded = () => {
        const count = iframeRef.current?.contentDocument?.querySelectorAll('input,select,textarea').length;
        console.log("Field count:", count);
        if (count && count > 0) {
          setPdfLoaded(true);
        } else {
          // Retry after a short delay if no fields found yet
          setTimeout(checkPdfLoaded, 500);
        }
      };
      
      setTimeout(checkPdfLoaded, 1000);
    }
  }, []);

  useEffect(() => {
    const id = searchParams.get("draftId");
    if (id && pdfLoaded) {
      setDraftId(id);
      // Load from localStorage for local drafts
      const ndaDrafts = JSON.parse(localStorage.getItem("ndaDrafts") || "[]");
      const draft = ndaDrafts.find((d: { id: string }) => d.id === id);
      if (draft && draft.fieldValues) {
        setLastSaved(draft.updated);
        setDocName(draft.name || "");
        setCounterpartyName(draft.counterparty || "");
        waitForFields(12000)
          .then(() => applyFields(draft.fieldValues))
          .catch(() =>
            setWarning("PDF fields not found. Check file path, worker, or XFA.")
          );
      } else {
        setWarning("Draft not found.");
      }
    }
  }, [searchParams, pdfLoaded, applyFields, waitForFields]);

  const handleSaveDraft = useCallback(async () => {
    if (!docName.trim()) {
      setWarning("Document name is required.");
      return;
    }
    if (!counterpartyName.trim()) {
      setWarning("Counterparty name is required.");
      return;
    }
    setSaving(true);
    setWarning("");
    try {
      const fieldValues = await collectFields();
      if (Object.keys(fieldValues).length === 0) throw new Error("No fields found");
      // Save locally
      let draftIdValue = draftId;
      const ndaDrafts = JSON.parse(localStorage.getItem("ndaDrafts") || "[]");
      if (!draftIdValue) {
        // New draft: generate a unique ID
        do {
          draftIdValue = Date.now().toString() + Math.floor(Math.random() * 10000).toString();
        } while (ndaDrafts.some((d: { id: string }) => d.id === draftIdValue));
      }
      const updatedAt = new Date().toISOString();
      const idx = ndaDrafts.findIndex((d: { id: string }) => d.id === draftIdValue);
      const draftObj = {
        id: draftIdValue,
        name: docName,
        counterparty: counterpartyName,
        status: "Draft",
        updated: updatedAt,
        pdfUrl: PDF_PATH,
        fieldValues
      };
      if (idx === -1) ndaDrafts.push(draftObj);
      else ndaDrafts[idx] = draftObj;
      localStorage.setItem("ndaDrafts", JSON.stringify(ndaDrafts));
      setDraftId(draftIdValue);
      setLastSaved(updatedAt);
      setWarning("Draft saved locally.");
    } catch (e) {
      setWarning(e instanceof Error ? e.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  }, [docName, counterpartyName, draftId, collectFields]);

  return (
    <div className="flex flex-col h-screen">
      <div className="p-4 bg-white shadow-md">
        <h1 className="text-xl font-semibold">Fill NDA</h1>
        <div className="mt-2 text-sm text-gray-500">
          {lastSaved && <span>Last saved: {new Date(lastSaved).toLocaleString()}</span>}
        </div>
        {warning && (
          <div className="mt-2 text-sm text-red-600">
            Warning: {warning}
          </div>
        )}
      </div>
      <div className="flex-1 overflow-auto">
        <iframe
          ref={iframeRef}
          src={viewerSrc}
          className="w-full h-full"
          frameBorder="0"
        />
      </div>
      <div className="p-4 bg-white shadow-md">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Document Name"
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
            className="flex-1 p-2 border rounded"
          />
          <input
            type="text"
            placeholder="Counterparty Name"
            value={counterpartyName}
            onChange={(e) => setCounterpartyName(e.target.value)}
            className="flex-1 p-2 border rounded"
          />
        </div>
        <div className="mt-2 flex gap-2">
          <button
            onClick={handleSaveDraft}
            disabled={saving}
            className="flex-1 p-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400"
          >
            {saving ? "Saving..." : "Save Draft Locally"}
          </button>
          <button
            onClick={() => router.push("/mynda")}
            className="flex-1 p-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            My NDAs
          </button>
          <button
            onClick={async () => {
              // Validate required fields before preview
              if (!docName.trim()) {
                setWarning("Document name is required for preview.");
                return;
              }
              if (!counterpartyName.trim()) {
                setWarning("Counterparty name is required for preview.");
                return;
              }
              
              try {
                // First collect the current field values from the PDF
                const fieldValues = await collectFields();
                
                // Generate the preview PDF with current values
                const response = await fetch('/api/ndas/preview', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    fieldValues,
                    templateId: 'mutual-nda-v3',
                    version: 3,
                    docName: docName || 'Preview NDA',
                    counterpartyName: counterpartyName || 'Preview'
                  }),
                });

                if (!response.ok) {
                  const errorText = await response.text();
                  throw new Error(`Failed to generate preview: ${errorText}`);
                }

                const result = await response.json();
                
                // Show the filled NDA PDF in a modal comment window using PDF.js viewer
                const previewPdfUrl = result.fileUrl;
                const viewerUrl = `/pdfjs/web/viewer.html?file=${encodeURIComponent(previewPdfUrl)}`;
                setPreviewUrl(viewerUrl);
                setShowPreview(true);
              } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                setWarning(`Failed to generate preview: ${errorMessage}`);
                console.error('Preview error:', error);
              }
            }}
            className="flex-1 p-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Preview
          </button>
        </div>
      </div>
      {/* Modal overlay for preview PDF */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded shadow-lg p-4 max-w-4xl w-full relative flex flex-col" style={{height: "85vh"}}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Preview NDA</h2>
              <button
                className="text-gray-600 hover:text-black text-xl"
                onClick={() => setShowPreview(false)}
                aria-label="Close preview"
              >
                &times;
              </button>
            </div>
            <iframe
              src={previewUrl}
              className="w-full flex-1 border rounded mb-4"
              style={{height: "65vh"}}
              frameBorder="0"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Close
              </button>
              <button
                onClick={async () => {
                  try {
                    // Save as draft with current values
                    await handleSaveDraft();
                    setShowPreview(false);
                  } catch {
                    setWarning("Failed to save draft. Please try again.");
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save as Draft
              </button>
              <button
                onClick={() => {
                  // TODO: Implement send functionality
                  setWarning("Send functionality coming soon!");
                  // You can implement email sending, sharing, or other send features here
                }}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}