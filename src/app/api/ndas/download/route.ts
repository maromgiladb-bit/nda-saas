import { NextRequest } from "next/server";
import path from "path";
import fs from "fs/promises";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const filename = searchParams.get("f");
  if (!filename) {
    return new Response("Missing filename", { status: 400 });
  }
  const filePath = path.join("/tmp", filename);
  try {
    const file = await fs.readFile(filePath);
    // Convert Buffer to Uint8Array for Response compatibility
    const fileData = new Uint8Array(file);
    return new Response(fileData, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename=\"${filename}\"`,
      },
    });
  } catch (err) {
    console.error("Download error:", err);
    return new Response("File not found", { status: 404 });
  }
}
