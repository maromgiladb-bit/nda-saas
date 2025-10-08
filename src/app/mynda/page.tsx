"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { RedirectToSignIn } from "@clerk/nextjs";
import PublicToolbar from "@/components/PublicToolbar";

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
  fieldValues?: Record<string, string | number | boolean>; // Added for field values
}

// Initial mock NDAs
const initialNDAs: NDA[] = [
  { id: "1", name: "Acme NDA", counterparty: "Acme Inc.", status: "Draft", updated: "2025-10-01" },
  { id: "2", name: "Beta NDA", counterparty: "BetaCorp", status: "Negotiating", updated: "2025-09-28" },
  { id: "3", name: "Gamma NDA", counterparty: "Gamma Ltd.", status: "Signed", updated: "2025-09-20" },
];

export default function MyNDAListPage() {
  const { user, isLoaded } = useUser();
  const [sentNDAs, setSentNDAs] = useState<NDA[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);

  useEffect(() => {
    const allNDAs = initialNDAs.filter(nda => nda.status !== "Draft");
    setSentNDAs(allNDAs);
    const localDrafts = JSON.parse(localStorage.getItem("ndaDrafts") || "[]");
    setDrafts(localDrafts);
  }, []);

  // Categorize NDAs
  const signedNDAs = sentNDAs.filter(nda => nda.status === "Signed");
  const negotiatingNDAs = sentNDAs.filter(nda => nda.status === "Negotiating");
  const archivedNDAs = sentNDAs.filter(nda => nda.status === "Archived");

  // Show loading while Clerk determines authentication state
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to sign-in if not authenticated
  if (!user) {
    return <RedirectToSignIn />;
  }

  return (
    <div>
      <PublicToolbar />
      <div className="max-w-4xl mx-auto p-8">
        <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My NDAs</h1>
        <Link href="/newnda">
          <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-semibold">+ New NDA</button>
        </Link>
      </div>

      {/* Negotiating NDAs Table */}
      <h2 className="text-xl font-bold mb-4">NDAs in Negotiation</h2>
      <table className="w-full border rounded shadow text-left mb-8">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">Counterparty</th>
            <th className="px-4 py-2">Updated</th>
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {negotiatingNDAs.length === 0 ? (
            <tr><td colSpan={4} className="text-gray-500 px-4 py-2">No NDAs in negotiation.</td></tr>
          ) : (
            negotiatingNDAs.map(nda => (
              <tr key={nda.id} className="border-t">
                <td className="px-4 py-2">{nda.name}</td>
                <td className="px-4 py-2">{nda.counterparty}</td>
                <td className="px-4 py-2">{nda.updated}</td>
                <td className="px-4 py-2">
                  <Link href={`/ndas/${nda.id}`} className="text-blue-600 hover:underline">View</Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Signed NDAs Table */}
      <h2 className="text-xl font-bold mb-4">Signed NDAs</h2>
      <table className="w-full border rounded shadow text-left mb-8">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">Counterparty</th>
            <th className="px-4 py-2">Updated</th>
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {signedNDAs.length === 0 ? (
            <tr><td colSpan={4} className="text-gray-500 px-4 py-2">No signed NDAs.</td></tr>
          ) : (
            signedNDAs.map(nda => (
              <tr key={nda.id} className="border-t">
                <td className="px-4 py-2">{nda.name}</td>
                <td className="px-4 py-2">{nda.counterparty}</td>
                <td className="px-4 py-2">{nda.updated}</td>
                <td className="px-4 py-2">
                  <Link href={`/ndas/${nda.id}`} className="text-blue-600 hover:underline">View</Link>
                </td>
              </tr>
            ))
          )}
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
                fieldValues?: Record<string, string | number | boolean>;
              }) => (
                <tr key={draft.id} className="border-b">
                  <td className="px-3 py-2 font-bold">{draft.name}</td>
                  <td className="px-3 py-2">{draft.counterparty}</td>
                  <td className="px-3 py-2 text-xs text-gray-500">{draft.updated}</td>
                  <td className="px-3 py-2">
                    <button
                      className="px-2 py-1 bg-blue-600 text-white rounded mr-2 text-xs"
                      onClick={() => {
                        window.open(`/newnda?draftId=${draft.id}`, "_blank");
                      }}
                    >
                      Open
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className="cursor-pointer inline-flex items-center justify-center"
                      title="Delete draft"
                      onClick={async () => {
                        if (window.confirm("Delete this draft?")) {
                          try {
                            // First, delete the preview files from server
                            const deleteResponse = await fetch('/api/ndas/delete', {
                              method: 'DELETE',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({ draftId: draft.id }),
                            });

                            if (!deleteResponse.ok) {
                              console.warn('Failed to delete server files:', await deleteResponse.text());
                            }

                            // Then, delete from localStorage
                            const ndaDrafts = JSON.parse(localStorage.getItem("ndaDrafts") || "[]");
                            const updated = ndaDrafts.filter((d: { id: string }) => d.id !== draft.id);
                            localStorage.setItem("ndaDrafts", JSON.stringify(updated));
                            window.location.reload();
                          } catch (error) {
                            console.error('Error deleting draft:', error);
                            // Still proceed with localStorage deletion even if server deletion fails
                            const ndaDrafts = JSON.parse(localStorage.getItem("ndaDrafts") || "[]");
                            const updated = ndaDrafts.filter((d: { id: string }) => d.id !== draft.id);
                            localStorage.setItem("ndaDrafts", JSON.stringify(updated));
                            window.location.reload();
                          }
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

      {/* Archived NDAs Table */}
      <h2 className="text-xl font-bold mb-4">Archived NDAs</h2>
      <table className="w-full border rounded shadow text-left mb-8">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">Counterparty</th>
            <th className="px-4 py-2">Updated</th>
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {archivedNDAs.length === 0 ? (
            <tr><td colSpan={4} className="text-gray-500 px-4 py-2">No archived NDAs.</td></tr>
          ) : (
            archivedNDAs.map(nda => (
              <tr key={nda.id} className="border-t">
                <td className="px-4 py-2">{nda.name}</td>
                <td className="px-4 py-2">{nda.counterparty}</td>
                <td className="px-4 py-2">{nda.updated}</td>
                <td className="px-4 py-2">
                  <Link href={`/ndas/${nda.id}`} className="text-blue-600 hover:underline">View</Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
    </div>
  );
}
