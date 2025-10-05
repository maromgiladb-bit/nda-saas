import { NextRequest } from "next/server";
import path from "path";
import fs from "fs/promises";
import { v4 as uuidv4 } from "uuid";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

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
    console.log("Received NDA data:", data);

    const templatePath = path.join(process.cwd(), "templates", "mutual-nda-v2.docx");
    const content = await fs.readFile(templatePath);
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

    doc.setData(mapBooleans(data));
    try {
      doc.render();
    } catch (err) {
      console.error("Docxtemplater error:", err);
      return new Response(JSON.stringify({ ok: false, error: "Template error" }), { status: 500 });
    }

    const buf = doc.getZip().generate({ type: "nodebuffer" });
    const filename = `nda-${uuidv4()}.docx`;
    const outPath = path.join("/tmp", filename);
    await fs.writeFile(outPath, buf);

    console.log("NDA generated:", outPath);
    return Response.json({ ok: true, fileUrl: `/api/ndas/download?f=${filename}` });
  } catch (err) {
    console.error("Preview route error:", err);
    return new Response(JSON.stringify({ ok: false, error: "Server error" }), { status: 500 });
  }
}
