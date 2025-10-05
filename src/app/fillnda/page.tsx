"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const PDF_PATH = "/pdfs/mutual-nda-v3-fillable.pdf";
const viewerSrc = `/pdfjs/web/viewer.html?file=${encodeURIComponent(PDF_PATH)}`;

export default function FillNDA() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [draftId, setDraftId] = useState("");
  const [lastSaved, setLastSaved] = useState("");
  const [status, setStatus] = useState("Loading…");
  const [warning, setWarning] = useState("");
  const [saving, setSaving] = useState(false);

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
    const name = window.prompt("Enter NDA name:", "Draft NDA");
    if (!name) return;
    const counterparty = window.prompt("Enter counterparty name:", "Unknown");
    if (!counterparty) return;
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
        name,
        counterparty,
        status: "Draft",
        updated: updatedAt,
        pdfUrl: PDF_PATH,
        fieldValues
      };
      if (idx >= 0) {
        ndaDrafts[idx] = draftObj;
      } else {
        ndaDrafts.push(draftObj);
      }
      localStorage.setItem("ndaDrafts", JSON.stringify(ndaDrafts));
      setDraftId(draftIdValue);
      setLastSaved(updatedAt);
      setStatus(`Draft: ${draftIdValue} | Last saved: ${updatedAt}`);
      router.replace(`?draftId=${draftIdValue}`);
    } catch {
      setWarning("Could not save draft. PDF fields missing?");
    } finally {
      setSaving(false);
    }
  }

  function handlePreview() {
    alert("Preview placeholder. Will POST fieldValues to /api/ndas/preview later.");
  }
  function handleSend() {
    alert("Send placeholder.");
  }

  return (
    <div className="max-w-4xl mx-auto p-8 relative">
      <a
        href="/mynda"
        className="absolute top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded text-sm shadow hover:bg-blue-600 transition"
        style={{ zIndex: 10 }}
      >
        My NDA's
      </a>
      <h1 className="text-2xl font-bold mb-6">Fill NDA</h1>
      <div className="flex gap-4 mb-4">
        <button
          className="bg-gray-600 text-white px-6 py-2 rounded font-semibold"
          onClick={handleSaveDraft}
          disabled={saving}
        >
          {saving ? "Saving…" : "Save Draft"}
        </button>
        <button
          className="bg-green-600 text-white px-6 py-2 rounded font-semibold"
          onClick={handlePreview}
        >
          Preview
        </button>
        <button
          className="bg-blue-600 text-white px-6 py-2 rounded font-semibold"
          onClick={handleSend}
        >
          Send
        </button>
      </div>
      <div className="mb-2 text-sm text-gray-700">
        {status}
        {warning && <span className="text-red-600 ml-2">{warning}</span>}
      </div>
      <iframe
        id="pdfFrame"
        ref={iframeRef}
        src={viewerSrc}
        width="100%"
        height={900}
        style={{ border: 0 }}
        title="Fillable NDA PDF"
      />
    </div>
  );
}
