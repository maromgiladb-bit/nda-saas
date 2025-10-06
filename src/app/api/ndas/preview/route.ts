import { NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import fs from "fs/promises";
import path from "path";

const TMP_DIR = path.join(process.cwd(), "tmp");
const PDFS_DIR = path.join(process.cwd(), "public", "pdfs");

async function getDraft(draftId: string) {
  // Replace with your actual draft loading logic
  const drafts: Array<{ id: string; fieldValues: Record<string, string | boolean>; templateId: string; version: number }> = JSON.parse(await fs.readFile(path.join(TMP_DIR, "drafts.json"), "utf8"));
  return drafts.find((d) => d.id === draftId);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  let fieldValues, templateId, version;

  if (body.draftId) {
    const draft = await getDraft(body.draftId);
    if (!draft) return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    fieldValues = draft.fieldValues;
    templateId = draft.templateId;
    version = draft.version;
  } else {
    fieldValues = body.fieldValues;
    templateId = body.templateId;
    version = body.version;
  }

  if (!templateId || !version) {
    return NextResponse.json({ error: "Missing template info" }, { status: 400 });
  }

  // Only support mutual-nda-v3 for now
  const pdfPath = path.join(PDFS_DIR, "mutual-nda-v3-fillable.pdf");
  const pdfBytes = await fs.readFile(pdfPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();

  // Set field values
  Object.entries(fieldValues).forEach(([key, value]) => {
    try {
      const field = form.getField(key);
      // @ts-expect-error: pdf-lib does not export field types for check/uncheck
      if (typeof value === 'boolean' && typeof field.check === 'function') {
        // @ts-expect-error: pdf-lib does not export field types for check
        if (value) field.check();
        // @ts-expect-error: pdf-lib does not export field types for uncheck
        else field.uncheck();
      // @ts-expect-error: pdf-lib does not export field types for setText
      } else if (typeof field.setText === 'function') {
        // @ts-expect-error: pdf-lib does not export field types for setText
        field.setText(String(value));
      }
    } catch {}
  });

  form.flatten();

  // Write preview file to public directory so PDF.js can access it directly
  const previewId = body.draftId || Math.random().toString(36).slice(2);
  const publicPreviewDir = path.join(process.cwd(), "public", "tmp");
  
  // Ensure the public/tmp directory exists
  try {
    await fs.mkdir(publicPreviewDir, { recursive: true });
  } catch {
    // Directory might already exist
  }
  
  const outPath = path.join(publicPreviewDir, `nda-preview-${previewId}.pdf`);
  await fs.writeFile(outPath, await pdfDoc.save());

  // Return direct path to the PDF file (accessible by PDF.js viewer)
  const fileUrl = `/tmp/nda-preview-${previewId}.pdf`;
  return NextResponse.json({ fileUrl });
}
