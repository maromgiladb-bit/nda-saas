import { NextResponse } from 'next/server'
import { templateManager } from '@/lib/template-manager'

/**
 * GET /api/ndas/template-config
 * Returns the current template configuration for the frontend
 */
export async function GET() {
  try {
    const config = templateManager.loadConfig()
    const fieldsBySection = templateManager.getFieldsBySection()
    const orderedSections = templateManager.getOrderedSections()
    const metadata = templateManager.getMetadata()

    return NextResponse.json({
      metadata,
      sections: orderedSections,
      fields: config.fields,
      fieldsBySection
    })
  } catch (error) {
    console.error('Error loading template config:', error)
    return NextResponse.json({ 
      error: 'Failed to load template configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
