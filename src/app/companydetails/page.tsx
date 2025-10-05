"use client";

import React, { useState } from "react";
import ndaSchema from "@/../schemas/nda-fields-v2.json";

// Fillable fields for company details
const companyFieldNames = [
  "party_a_name",           // Company Name
  "party_a_address",        // Address
  "party_a_signatory_name", // Signatory Name
  "party_a_title",          // Title
  "governing_law",          // Preferred Governing Law
  "ip_ownership",           // IP Ownership
  "non_solicit",            // Non-Solicitation
  "exclusivity"             // Exclusivity
];

interface Field {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  options?: string[];
}
const fields = ndaSchema.fields.filter((f: Field) => companyFieldNames.includes(f.name));

function getInitialValues() {
  const vals: Record<string, string | boolean> = {};
  fields.forEach((f: Field) => {
    vals[f.name] = f.type === "boolean" ? false : "";
  });
  return vals;
}

export default function CompanyDetailsPage() {
  const [values, setValues] = useState(getInitialValues());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  function validate() {
    const errs: Record<string, string> = {};
    fields.forEach((f: Field) => {
      if (f.required && !values[f.name]) {
        errs[f.name] = "Required";
      }
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const target = e.target as HTMLInputElement | HTMLSelectElement;
    const { name, value, type } = target;
    const checked = (target as HTMLInputElement).checked;
    setValues(v => ({
      ...v,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    // Here you would save to user profile or session
    setSuccess(true);
  }

  return (
    <div className="max-w-xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Company Details</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
  {fields.map((f: Field) => (
          <div key={f.name}>
            <label className="block font-medium mb-1">
              {f.label}
              {f.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {f.type === "select" ? (
              <select
                name={f.name}
                value={values[f.name] as string}
                onChange={handleChange}
                className="border rounded px-3 py-2 w-full"
              >
                <option value="">Select...</option>
                {f.options?.map((opt: string) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : f.type === "boolean" ? (
              <input
                type="checkbox"
                name={f.name}
                checked={!!values[f.name]}
                onChange={handleChange}
                className="mr-2"
              />
            ) : (
              <input
                type={f.type}
                name={f.name}
                value={values[f.name] as string}
                onChange={handleChange}
                className="border rounded px-3 py-2 w-full"
              />
            )}
            {errors[f.name] && (
              <div className="text-red-500 text-sm mt-1">{errors[f.name]}</div>
            )}
          </div>
        ))}
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Save Details
        </button>
        {success && (
          <div className="text-green-600 mt-4">Details saved!</div>
        )}
      </form>
    </div>
  );
}
