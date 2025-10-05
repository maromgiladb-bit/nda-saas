"use client";

import React, { useState } from "react";
import ndaSchema from "@/../schemas/nda-fields-v2.json";

// Types
interface Field {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  options?: string[];
}
interface Section {
  title: string;
  fields: string[];
}

const fields: Field[] = ndaSchema.fields;
const sections: Section[] = ndaSchema.ui.sections;

function getInitialValues() {
  const vals: Record<string, string | boolean> = {};
  fields.forEach(f => {
    vals[f.name] = f.type === "boolean" ? false : "";
  });
  return vals;
}

export default function CreateNDAForm() {
  const [values, setValues] = useState(getInitialValues());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const errs: Record<string, string> = {};
    fields.forEach(f => {
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

  async function handlePreview() {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ndas/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (data.ok && data.fileUrl) {
        window.open(data.fileUrl, "_blank");
      } else {
        alert("Error generating NDA");
      }
    } catch (err) {
      console.error("Preview error", err);
      alert("Error generating NDA");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Create NDA</h1>
      <form
        onSubmit={e => {
          e.preventDefault();
          handlePreview();
        }}
        className="space-y-8"
      >
        {sections.map(section => (
          <div key={section.title}>
            <h2 className="text-lg font-semibold mb-2">{section.title}</h2>
            <div className="grid gap-4">
              {section.fields.map(fieldName => {
                const f = fields.find(field => field.name === fieldName);
                if (!f) return null;
                return (
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
                        {f.options?.map(opt => (
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
                );
              })}
            </div>
          </div>
        ))}
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Generating..." : "Preview"}
        </button>
      </form>
    </div>
  );
}
