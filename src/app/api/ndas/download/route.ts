import { NextRequest } from "next/server";
import fs from "fs/promises";
import path from "path";

const TMP_DIR = path.join(process.cwd(), "tmp");

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fileName = searchParams.get("f");
  if (!fileName || !fileName.endsWith(".pdf")) {
    return new Response("Invalid file", { status: 400 });
  }
  const filePath = path.join(TMP_DIR, fileName);
  try {
    const file = await fs.readFile(filePath);
    return new Response(file, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="preview.pdf"',
      },
    });
  } catch {
    return new Response("File not found", { status: 404 });
  }
}
