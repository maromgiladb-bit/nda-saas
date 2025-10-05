"use client";
import React from "react";

export default function ViewPDFPage() {
  return (
    <div className="w-full max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">View NDA Template PDF</h1>
      <iframe
        src="/nda-template/mutual-nda-v2-fillable.pdf"
        title="NDA PDF"
        className="w-full h-[600px] border rounded shadow"
      />
    </div>
  );
}
