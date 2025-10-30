import { NextRequest, NextResponse } from 'next/server';
import { getActiveTemplates, getTemplateById, getTemplateFields } from '@/lib/templateManager';

export const runtime = 'nodejs';

/**
 * GET /api/templates
 * List all available NDA templates
 * 
 * Query params:
 * - category: Filter by category (mutual, one-way, custom)
 * - id: Get specific template by ID
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('id');
    const category = searchParams.get('category');

    // Get specific template by ID
    if (templateId) {
      const template = getTemplateById(templateId);
      
      if (!template) {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        );
      }

      // Include field definitions
      const fields = getTemplateFields(templateId);

      return NextResponse.json({
        template,
        fields
      });
    }

    // Get all active templates
    let templates = getActiveTemplates();

    // Filter by category if specified
    if (category) {
      templates = templates.filter(t => t.category === category);
    }

    return NextResponse.json({
      templates,
      count: templates.length
    });

  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch templates',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
