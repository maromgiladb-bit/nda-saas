import { NextRequest, NextResponse } from 'next/server'
import { renderNdaHtml } from '@/lib/renderNdaHtml'

/**
 * Debug endpoint to test renderNdaHtml without auth
 * POST /api/debug-preview
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const templateId = body.templateId || 'professional_mutual_nda_v1'

        console.log('Debug preview - rendering template:', templateId)

        const html = await renderNdaHtml(body, templateId)

        return NextResponse.json({
            success: true,
            htmlLength: html.length,
            htmlPreview: html.substring(0, 500)
        })
    } catch (error) {
        console.error('Debug preview error:', error)
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        }, { status: 500 })
    }
}

export async function GET() {
    return NextResponse.json({ message: 'Use POST to test rendering' })
}
