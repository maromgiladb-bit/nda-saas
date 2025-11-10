import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Only available in development
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
    }

    const url = new URL(req.url);
    const file = url.searchParams.get('file');
    if (!file || !file.endsWith('.hbs')) {
      return NextResponse.json({ error: 'Invalid file' }, { status: 400 });
    }

    // Prevent path traversal
    if (file.includes('..') || file.includes('/') || file.includes('\\')) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
    }

    const templatesDir = path.join(process.cwd(), 'templates');
    const fullPath = path.join(templatesDir, file);

    try {
      const stat = await fs.stat(fullPath);
      if (!stat.isFile()) throw new Error('Not a file');
      const content = await fs.readFile(fullPath, 'utf8');
      return new NextResponse(content, { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    } catch (err) {
      console.error('Error reading template file:', err);
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error in /api/templates/raw:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
