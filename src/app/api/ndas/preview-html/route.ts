import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { renderNdaHtml } from '@/lib/renderNdaHtml'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('🌐 HTML Preview request received')

    // Support both draftId (for saved drafts) and direct data (for unsaved forms)
    let formData: Record<string, unknown>
    let templateId = 'mutual-nda-html' // Default to HTML template

    if (body.draftId) {
      // Load from database
      console.log('🌐 Loading draft from database:', body.draftId)
      
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
    } else {
      // Use provided data directly
      formData = { ...body }
      delete formData.draftId // Clean up if present
    }
    
    // Allow template override from request
    if (body.templateId) {
      templateId = body.templateId
    }

    // Process "ask receiver to fill" placeholders
    const processedData = { ...formData }
    
    if (formData.party_a_ask_receiver_fill) {
      processedData.party_a_name = formData.party_a_name || "[To be filled by receiving party]"
      processedData.party_a_address = formData.party_a_address || "[To be filled by receiving party]"
      processedData.party_a_signatory_name = formData.party_a_signatory_name || "[To be filled by receiving party]"
      processedData.party_a_title = formData.party_a_title || "[To be filled by receiving party]"
      console.log('🌐 Party A: ask receiver to fill')
    }
    
    if (formData.party_b_ask_receiver_fill) {
      processedData.party_b_name = formData.party_b_name || "[To be filled by receiving party]"
      processedData.party_b_address = formData.party_b_address || "[To be filled by receiving party]"
      processedData.party_b_signatory_name = formData.party_b_signatory_name || "[To be filled by receiving party]"
      processedData.party_b_title = formData.party_b_title || "[To be filled by receiving party]"
      processedData.party_b_email = formData.party_b_email || "[To be filled by receiving party]"
      console.log('🌐 Party B: ask receiver to fill')
    }

    console.log('🌐 Rendering HTML from template:', templateId)
    const html = await renderNdaHtml(processedData, templateId)

    console.log('✅ HTML generated successfully, size:', html.length, 'chars')

    return NextResponse.json({
      html,
      templateId,
      size: html.length
    })

  } catch (error) {
    console.error('❌ Error generating HTML preview:', error)
    return NextResponse.json({
      error: 'Failed to generate HTML preview',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
