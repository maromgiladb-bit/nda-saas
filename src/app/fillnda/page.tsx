"use client";

import React from "react";

export default function FillNDAForm() {
  return (
  <div className="w-full max-w-[1600px] mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Fill the necceserry details, we will do the rest.</h1>
        <button
          type="button"
          className="bg-blue-600 text-white px-8 py-3 rounded shadow hover:bg-blue-700 text-lg font-semibold ml-4"
        >
          Send
        </button>
      </div>
        <iframe
          src="/nda-template/mutual-nda-v2-fillable.pdf"
          title="NDA PDF Preview"
          className="w-full h-[600px] border rounded shadow"
          style={{ minWidth: "1200px" }}
        />
    </div>
  );
}
