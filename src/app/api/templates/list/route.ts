import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow in development mode
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
    }

    // Scan templates directory for all .hbs files
    const templatesDir = path.join(process.cwd(), 'templates');
    const files = await fs.readdir(templatesDir);
    
    const templates = files
      .filter(file => file.endsWith('.hbs'))
      .map(file => {
        const id = file.replace('.hbs', '');
        return {
          id,
          name: id.split(/[-_]/).map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' '),
          templateFile: file,
          isActive: true
        };
      });
    
    return NextResponse.json({
      templates,
      count: templates.length
    });
  } catch (error) {
    console.error('Error listing templates:', error);
    return NextResponse.json(
      { 
        error: 'Failed to list templates',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
