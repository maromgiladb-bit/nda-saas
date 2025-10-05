import { NextRequest } from "next/server";
import path from "path";
import fs from "fs/promises";
import { v4 as uuidv4 } from "uuid";
import { PDFDocument } from "pdf-lib";

// Helper: Map boolean fields to Yes/No
function mapBooleans(obj: Record<string, string | boolean>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k in obj) {
    out[k] = typeof obj[k] === "boolean" ? (obj[k] ? "Yes" : "No") : String(obj[k]);
  }
  return out;
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    console.log("Received NDA PDF data:", data);
    const mapped = mapBooleans(data);

    // Load the PDF template
    const templatePath = path.join(process.cwd(), "..", "easy-nda-other-files", "mutual-nda-v2.pdf");
    const pdfBytes = await fs.readFile(templatePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Fill fields (assumes field names in PDF match schema names)
    const form = pdfDoc.getForm();
    Object.entries(mapped).forEach(([key, value]) => {
      try {
        const field = form.getTextField(key);
        field.setText(value);
      } catch (e) {
        // Field not found, skip
      }
    });
    form.flatten();

    const filledPdfBytes = await pdfDoc.save();
    const filename = `nda-filled-${uuidv4()}.pdf`;
    const tmpDir = path.join(process.cwd(), "tmp");
    await fs.mkdir(tmpDir, { recursive: true });
    const outPath = path.join(tmpDir, filename);
    await fs.writeFile(outPath, filledPdfBytes);

    console.log("Filled NDA PDF generated:", outPath);
    return Response.json({ ok: true, fileUrl: `/api/ndas/downloadpdf?f=${filename}` });
  } catch (err) {
    console.error("Fill PDF route error:", err);
    return new Response(JSON.stringify({ ok: false, error: "Server error" }), { status: 500 });
  }
}
