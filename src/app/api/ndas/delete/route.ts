import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const TMP_DIR = path.join(process.cwd(), "tmp");
const PUBLIC_TMP_DIR = path.join(process.cwd(), "public", "tmp");

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { draftId } = body;

    if (!draftId) {
      return NextResponse.json({ error: "Draft ID is required" }, { status: 400 });
    }

    const filesToDelete = [
      // Old tmp directory files
      path.join(TMP_DIR, `nda-preview-${draftId}.pdf`),
      path.join(TMP_DIR, `nda-filled-${draftId}.pdf`),
      // New public/tmp directory files
      path.join(PUBLIC_TMP_DIR, `nda-preview-${draftId}.pdf`),
      path.join(PUBLIC_TMP_DIR, `nda-filled-${draftId}.pdf`),
    ];

    const deletedFiles = [];
    const errors = [];

    // Attempt to delete each file
    for (const filePath of filesToDelete) {
      try {
        await fs.unlink(filePath);
        deletedFiles.push(path.basename(filePath));
      } catch (error) {
        // File might not exist, which is fine
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          errors.push(`Failed to delete ${path.basename(filePath)}: ${(error as Error).message}`);
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      deletedFiles,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Delete files error:', error);
    return NextResponse.json(
      { error: 'Failed to delete files' }, 
      { status: 500 }
    );
  }
}