import { NextRequest, NextResponse } from 'next/server';
import {
  compareTemplates,
  getTemplateVersions,
  getLatestTemplate,
  getTemplateMetadata
} from '@/lib/templateManager';

export const runtime = 'nodejs';

/**
 * GET /api/templates/compare
 * Compare two templates or get version history
 * 
 * Query params:
 * - template1: First template ID
 * - template2: Second template ID
 * - family: Get all versions of a template family (e.g., "mutual-nda")
 * - latest: Get latest version of a template family
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const template1 = searchParams.get('template1');
    const template2 = searchParams.get('template2');
    const family = searchParams.get('family');
    const latest = searchParams.get('latest');

    // Get version history for a template family
    if (family) {
      const versions = getTemplateVersions(family);
      
      if (versions.length === 0) {
        return NextResponse.json(
          { error: `No templates found for family: ${family}` },
          { status: 404 }
        );
      }

      return NextResponse.json({
        family,
        versions: versions.map(v => ({
          id: v.id,
          name: v.name,
          version: v.version,
          isActive: v.isActive,
          deprecated: v.deprecated,
          replacedBy: v.replacedBy,
          createdAt: v.createdAt,
          updatedAt: v.updatedAt
        })),
        count: versions.length
      });
    }

    // Get latest version of a template family
    if (latest) {
      const latestTemplate = getLatestTemplate(latest);
      
      if (!latestTemplate) {
        return NextResponse.json(
          { error: `No active template found for family: ${latest}` },
          { status: 404 }
        );
      }

      return NextResponse.json({
        family: latest,
        latest: {
          id: latestTemplate.id,
          name: latestTemplate.name,
          version: latestTemplate.version,
          description: latestTemplate.description
        }
      });
    }

    // Compare two templates
    if (template1 && template2) {
      try {
        const comparison = compareTemplates(template1, template2);
        const metadata1 = getTemplateMetadata(template1);
        const metadata2 = getTemplateMetadata(template2);

        return NextResponse.json({
          template1: metadata1,
          template2: metadata2,
          comparison: {
            versionChange: comparison.versionDiff,
            addedFields: comparison.addedFields,
            removedFields: comparison.removedFields,
            changedDefaults: comparison.changedDefaults,
            summary: {
              fieldsAdded: comparison.addedFields.length,
              fieldsRemoved: comparison.removedFields.length,
              defaultsChanged: Object.keys(comparison.changedDefaults).length
            }
          }
        });
      } catch (error) {
        return NextResponse.json(
          { 
            error: 'Failed to compare templates',
            details: error instanceof Error ? error.message : 'Unknown error'
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { 
        error: 'Missing required parameters',
        usage: {
          compare: '/api/templates/compare?template1=ID1&template2=ID2',
          versions: '/api/templates/compare?family=template-prefix',
          latest: '/api/templates/compare?latest=template-prefix'
        }
      },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in template comparison:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
