import { NextResponse } from 'next/server'
import { TEMPLATE_CONFIG, getTemplateContent } from '@/lib/bundledTemplates.generated'

/**
 * Debug endpoint to verify template loading works correctly
 * GET /api/debug-templates
 */
export async function GET() {
    try {
        // Test that config is loaded
        const templateCount = TEMPLATE_CONFIG.templates.length

        // Test that template content is accessible
        const professionalTemplate = getTemplateContent('professional_mutual_nda_v1')

        return NextResponse.json({
            success: true,
            templateCount,
            professionalTemplateLoaded: !!professionalTemplate,
            professionalTemplateSize: professionalTemplate?.length || 0,
            templateIds: TEMPLATE_CONFIG.templates.map(t => t.id)
        })
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        }, { status: 500 })
    }
}
