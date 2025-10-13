"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const PDF_PATH = "/pdfs/mutual-nda-v3-fillable.pdf";
const viewerSrc = `/pdfjs/web/viewer.html?file=${encodeURIComponent(PDF_PATH)}`;

export default function NewNDA() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [draftId, setDraftId] = useState("");
  const [lastSaved, setLastSaved] = useState("");
  const [status, setStatus] = useState("Loading…");
  const [warning, setWarning] = useState("");
  const [saving, setSaving] = useState(false);
  const [docName, setDocName] = useState("");
  const [counterpartyName, setCounterpartyName] = useState("");

  // Prefer AcroForm field name (aria-label), then title, name, id. Never use data-annotation-id or fallback keys.
  function resolveKey(el: Element): string | null {
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
  }

  // Wait for fields in the iframe's contentDocument
  async function waitForFields(timeout = 12000): Promise<Document> {
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
  }

  // Only collect fields with stable keys
  async function collectFields(): Promise<Record<string, string | boolean>> {
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
  }

  // Only apply values to fields with stable keys
  async function applyFields(values: Record<string, string | boolean>) {
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
  }

  useEffect(() => {
    if (iframeRef.current) {
      console.log("Iframe src:", iframeRef.current.src);
      setTimeout(() => {
        const count = iframeRef.current?.contentDocument?.querySelectorAll('input,select,textarea').length;
        console.log("Field count:", count);
      }, 3000);
    }
  }, []);

  useEffect(() => {
    const id = searchParams.get("draftId");
    if (id) {
      setDraftId(id);
      fetch(`/api/drafts/${id}`)
        .then((r) => r.json())
        .then((draft) => {
          if (draft.templateId === "mutual-nda-v3" && draft.version === 3) {
            setLastSaved(draft.updatedAt);
            setStatus(`Draft: ${id} | Last saved: ${draft.updatedAt}`);
            waitForFields(iframeRef.current!)
              .then(() => applyFields(iframeRef.current!, draft.fieldValues))
              .catch(() =>
                setWarning("PDF fields not found. Check file path, worker, or XFA.")
              );
          } else {
            setWarning("Draft template/version mismatch.");
          }
        })
        .catch(() => setWarning("Draft not found."));
    } else {
      setStatus("No draft loaded.");
    }
  }, [searchParams]);

  // Fix legacy calls in useEffect (PDF field application)
  useEffect(() => {
    if (!iframeRef.current) return;
    const draftIdParam = searchParams.get("draftId");
    if (!draftIdParam) return;
    const ndaDrafts = JSON.parse(localStorage.getItem("ndaDrafts") || "[]");
    const draft = ndaDrafts.find((d: any) => d.id === draftIdParam);
    if (!draft || !draft.fieldValues) return;
    waitForFields(12000)
      .then(() => applyFields(draft.fieldValues))
      .catch(() => {});
  }, [searchParams, applyFields]);

  async function handleSaveDraft() {
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
      setStatus(`Draft: ${draftIdValue} | Last saved: ${updatedAt}`);
      setWarning("Draft saved locally.");
    } catch (e) {
      setWarning(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="p-4 bg-white shadow-md">
        <h1 className="text-xl font-semibold">Fill NDA</h1>
        <div className="mt-2">
          <a
            href={viewerSrc}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Open PDF in Viewer
          </a>
        </div>
        <div className="mt-2 text-sm text-gray-500">
          {status}
          {lastSaved && <span> | Last saved: {new Date(lastSaved).toLocaleString()}</span>}
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
            onClick={() => router.push("/nda-templates")}
            className="flex-1 p-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Back to Templates
          </button>
        </div>
      </div>
    </div>
  );
}
