import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { renderNdaHtml } from '@/lib/renderNdaHtml'
import { renderHtmlToPdf } from '@/lib/htmlToPdf'

export const runtime = 'nodejs' // Required for Puppeteer

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    const isDev = process.env.NODE_ENV === 'development'
    
    if (!userId && !isDev) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (isDev && !userId) {
      console.log('🔧 Development mode: Allowing preview without authentication')
    }

    const body = await request.json()
    console.log('📄 PDF Preview request received')

    // Support both draftId (for saved drafts) and direct data (for unsaved forms)
    let formData: Record<string, unknown>
    let templateId = 'professional_mutual_nda_v1' // Default template

    if (body.draftId) {
      // Load from database (only works with authenticated users)
      if (!userId) {
        return NextResponse.json({ 
          error: 'Authentication required to load drafts',
          details: 'Please provide data directly instead of using draftId'
        }, { status: 401 })
      }

      console.log('📄 Loading draft from database:', body.draftId)
      
      const user = await prisma.users.findUnique({
        where: { external_id: userId }
      })

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      const draft = await prisma.nda_drafts.findUnique({
        where: {
          id: body.draftId,
          created_by_id: user.id
        }
      })

      if (!draft) {
        return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
      }

      formData = (draft.data as Record<string, unknown>) || {}
      
      // Allow template override from request even when loading from draft
      if (body.templateId) {
        templateId = body.templateId
        console.log('📋 Using templateId from request (with draftId):', templateId)
      }
    } else {
      // Use provided data directly
      formData = { ...body }
      delete formData.draftId // Clean up if present
      // Allow template override from request
      if (body.templateId) {
        templateId = body.templateId
        delete formData.templateId // Remove from formData to avoid confusion
        console.log('📋 Using templateId from request:', templateId)
      }
    }

    // Process "ask receiver to fill" placeholders
    const processedData = { ...formData }
    
    if (formData.party_a_ask_receiver_fill) {
      processedData.party_a_name = formData.party_a_name || "[To be filled by receiving party]"
      processedData.party_a_address = formData.party_a_address || "[To be filled by receiving party]"
      processedData.party_a_signatory_name = formData.party_a_signatory_name || "[To be filled by receiving party]"
      processedData.party_a_title = formData.party_a_title || "[To be filled by receiving party]"
      console.log('📄 Party A: ask receiver to fill')
    }
    
    if (formData.party_b_ask_receiver_fill) {
      processedData.party_b_name = formData.party_b_name || "[To be filled by receiving party]"
      processedData.party_b_address = formData.party_b_address || "[To be filled by receiving party]"
      processedData.party_b_signatory_name = formData.party_b_signatory_name || "[To be filled by receiving party]"
      processedData.party_b_title = formData.party_b_title || "[To be filled by receiving party]"
      processedData.party_b_email = formData.party_b_email || "[To be filled by receiving party]"
      console.log('📄 Party B: ask receiver to fill')
    }

    // Transform party_a/party_b to party_1/party_2 if needed (for templates that use party_1/party_2 naming)
    // This ensures compatibility with all template formats
    if (!processedData.party_1_name && processedData.party_a_name) {
      processedData.party_1_name = processedData.party_a_name
      processedData.party_1_address = processedData.party_a_address
      processedData.party_1_signatory_name = processedData.party_a_signatory_name
      processedData.party_1_signatory_title = processedData.party_a_title
      processedData.party_1_phone = processedData.party_a_phone || ''
      processedData.party_1_emails_joined = processedData.party_a_email || ''
      console.log('📄 Mapped party_a_* to party_1_*')
    }
    
    if (!processedData.party_2_name && processedData.party_b_name) {
      processedData.party_2_name = processedData.party_b_name
      processedData.party_2_address = processedData.party_b_address
      processedData.party_2_signatory_name = processedData.party_b_signatory_name
      processedData.party_2_signatory_title = processedData.party_b_title
      processedData.party_2_phone = processedData.party_b_phone || ''
      processedData.party_2_emails_joined = processedData.party_b_email || ''
      console.log('📄 Mapped party_b_* to party_2_*')
    }

    console.log('📄 Rendering HTML from template:', templateId)
    const html = await renderNdaHtml(processedData, templateId)

    console.log('📄 Converting HTML to PDF with 1:1 rendering...')
    const pdfBuffer = await renderHtmlToPdf(html, {
      pageWidthPx: 900,  // Match preview container width
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
      isA4: true,
      debugScreenshot: false,  // Set to true to save debug screenshot
    })

    console.log('✅ PDF generated successfully')

    // Return as base64 data URL for compatibility with existing UI
    const base64 = pdfBuffer.toString('base64')
    const dataUrl = `data:application/pdf;base64,${base64}`

    return NextResponse.json({
      fileUrl: dataUrl,
      base64,
      mime: 'application/pdf',
      filename: `${formData.docName || 'NDA'}.pdf`
    })

  } catch (error) {
    console.error('❌ Error generating preview:', error)
    return NextResponse.json({
      error: 'Failed to generate preview',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}