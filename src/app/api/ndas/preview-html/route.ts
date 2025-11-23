import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { renderNdaHtml } from '@/lib/renderNdaHtml'
import createDOMPurify from 'dompurify'
import { JSDOM } from 'jsdom'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('🌐 HTML Preview request received')
    console.log('🌐 Request body keys:', Object.keys(body))
    console.log('🌐 body.templateId:', body.templateId)

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
      console.log('🌐 Using templateId from request:', templateId)
    } else {
      console.log('🌐 Using default templateId:', templateId)
    }

    // Process "ask receiver to fill" placeholders for individual Party B fields
    const processedData = { ...formData }
    
    if (formData.party_a_ask_receiver_fill) {
      processedData.party_a_name = formData.party_a_name || "[To be filled by receiving party]"
      processedData.party_a_address = formData.party_a_address || "[To be filled by receiving party]"
      processedData.party_a_signatory_name = formData.party_a_signatory_name || "[To be filled by receiving party]"
      processedData.party_a_title = formData.party_a_title || "[To be filled by receiving party]"
      console.log('🌐 Party A: ask receiver to fill')
    }
    
    // Handle individual Party B fields
    if (formData.party_b_name_ask_receiver) {
      processedData.party_b_name = formData.party_b_name || "[To be filled by receiving party]"
      console.log('🌐 Party B name: ask receiver to fill')
    }
    if (formData.party_b_address_ask_receiver) {
      processedData.party_b_address = formData.party_b_address || "[To be filled by receiving party]"
      console.log('🌐 Party B address: ask receiver to fill')
    }
    if (formData.party_b_phone_ask_receiver) {
      processedData.party_b_phone = formData.party_b_phone || "[To be filled by receiving party]"
      console.log('🌐 Party B phone: ask receiver to fill')
    }
    if (formData.party_b_signatory_name_ask_receiver) {
      processedData.party_b_signatory_name = formData.party_b_signatory_name || "[To be filled by receiving party]"
      console.log('🌐 Party B signatory: ask receiver to fill')
    }
    if (formData.party_b_title_ask_receiver) {
      processedData.party_b_title = formData.party_b_title || "[To be filled by receiving party]"
      console.log('🌐 Party B title: ask receiver to fill')
    }
    if (formData.party_b_email_ask_receiver) {
      processedData.party_b_email = formData.party_b_email || "[To be filled by receiving party]"
      console.log('🌐 Party B email: ask receiver to fill')
    }

    console.log('🌐 Rendering HTML from template:', templateId)
    const html = await renderNdaHtml(processedData, templateId)

    // G) Server-side HTML sanitization to prevent XSS
    const { window } = new JSDOM('')
    const DOMPurify = createDOMPurify(window)
    const sanitizedHtml = DOMPurify.sanitize(html, {
      USE_PROFILES: { html: true },
      // Allow all necessary tags for a complete HTML document
      ALLOWED_TAGS: ['html', 'head', 'body', 'meta', 'title', 'link', 'style', 'div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'strong', 'em', 'u', 'b', 'i', 'br', 'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'section', 'article', 'header', 'footer', 'main', 'aside', 'nav', 'hr', 'blockquote', 'pre', 'code', 'img', 'svg', 'path', 'circle', 'rect', 'line', 'polygon', 'polyline'],
      // Allow all necessary attributes including meta and link attributes
      ALLOWED_ATTR: ['class', 'style', 'id', 'href', 'rel', 'type', 'charset', 'name', 'content', 'crossorigin', 'viewport', 'width', 'height', 'viewBox', 'fill', 'stroke', 'stroke-width', 'd', 'cx', 'cy', 'r', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'points', 'src', 'alt'],
      WHOLE_DOCUMENT: true,
      RETURN_DOM: false,
      RETURN_DOM_FRAGMENT: false,
    })

    console.log('✅ HTML generated and sanitized, size:', sanitizedHtml.length, 'chars')

    return NextResponse.json({
      html: sanitizedHtml,
      templateId,
      size: sanitizedHtml.length
    })

  } catch (error) {
    console.error('❌ Error generating HTML preview:', error)
    return NextResponse.json({
      error: 'Failed to generate HTML preview',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
