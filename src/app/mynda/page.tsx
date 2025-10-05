"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";

// Mock NDA data type
interface NDA {
  id: string;
  name: string;
  counterparty: string;
  status: string;
  updated: string;
}

interface Draft {
  id: string;
  name: string;
  counterparty: string;
  status: string;
  updated: string;
  pdfUrl?: string;
  fieldValues?: Record<string, any>; // Added for field values
}

// Initial mock NDAs
const initialNDAs: NDA[] = [
  { id: "1", name: "Acme NDA", counterparty: "Acme Inc.", status: "Draft", updated: "2025-10-01" },
  { id: "2", name: "Beta NDA", counterparty: "BetaCorp", status: "Negotiating", updated: "2025-09-28" },
  { id: "3", name: "Gamma NDA", counterparty: "Gamma Ltd.", status: "Signed", updated: "2025-09-20" },
];

export default function MyNDAListPage() {
  const [sentNDAs, setSentNDAs] = useState<NDA[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);

  useEffect(() => {
    const allNDAs = initialNDAs.filter(nda => nda.status !== "Draft");
    setSentNDAs(allNDAs);
    const localDrafts = JSON.parse(localStorage.getItem("ndaDrafts") || "[]");
    setDrafts(localDrafts);
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My NDAs</h1>
        <Link href="/fillnda">
          <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-semibold">+ New NDA</button>
        </Link>
      </div>
      {/* Sent NDAs Table */}
      <table className="w-full border rounded shadow text-left mb-12">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">Counterparty</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Updated</th>
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sentNDAs.map(nda => (
            <tr key={nda.id} className="border-t">
              <td className="px-4 py-2">{nda.name}</td>
              <td className="px-4 py-2">{nda.counterparty}</td>
              <td className="px-4 py-2">{nda.status}</td>
              <td className="px-4 py-2">{nda.updated}</td>
              <td className="px-4 py-2">
                <Link href={`/ndas/${nda.id}`} className="text-blue-600 hover:underline">View</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Drafts Table */}
      <h2 className="text-xl font-bold mb-4">Drafts</h2>
      {drafts.length === 0 ? (
        <div className="text-gray-500">No drafts saved.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border rounded bg-white">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Counterparty</th>
                <th className="px-3 py-2 text-left">Last Updated</th>
                <th className="px-3 py-2 text-left">Actions</th>
                <th className="px-3 py-2 text-left">Delete</th>
              </tr>
            </thead>
            <tbody>
              {drafts.map((draft: {
                id: string;
                name: string;
                counterparty: string;
                status: string;
                updated: string;
                pdfUrl?: string;
                fieldValues?: Record<string, string | boolean>;
              }) => (
                <tr key={draft.id} className="border-b">
                  <td className="px-3 py-2 font-bold">{draft.name}</td>
                  <td className="px-3 py-2">{draft.counterparty}</td>
                  <td className="px-3 py-2 text-xs text-gray-500">{draft.updated}</td>
                  <td className="px-3 py-2">
                    <button
                      className="px-2 py-1 bg-blue-600 text-white rounded mr-2 text-xs"
                      onClick={() => {
                        window.open(`/fillnda?draftId=${draft.id}`, "_blank");
                      }}
                    >
                      Open
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className="cursor-pointer inline-flex items-center justify-center"
                      title="Delete draft"
                      onClick={() => {
                        if (window.confirm("Delete this draft?")) {
                          const ndaDrafts = JSON.parse(localStorage.getItem("ndaDrafts") || "[]");
                          const updated = ndaDrafts.filter((d: { id: string }) => d.id !== draft.id);
                          localStorage.setItem("ndaDrafts", JSON.stringify(updated));
                          window.location.reload();
                        }
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="black" viewBox="0 0 24 24" stroke="black"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
