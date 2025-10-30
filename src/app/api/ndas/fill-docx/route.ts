import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import fs from 'fs'
import path from 'path'
import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.json()
    console.log('📄 DOCX Fill Request - Fields:', Object.keys(formData))

    // Load the DOCX template
    const templatePath = path.join(process.cwd(), 'public', 'pdfs', '251025 Mutual NDA v1.docx')
    
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json({ 
        error: 'Template not found', 
        details: `Template file not found at ${templatePath}` 
      }, { status: 404 })
    }

    // Read the template file
    const content = fs.readFileSync(templatePath, 'binary')
    
    // Load the DOCX file with PizZip
    const zip = new PizZip(content)
    
    // Create a docxtemplater instance
    let doc
    try {
      doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: {
          start: '{{',
          end: '}}'
        }
      })
    } catch (error: unknown) {
      console.error('❌ DOCX template initialization error:', error)
      
      // Check if it's a template error with multiple issues
      if (error && typeof error === 'object' && 'properties' in error) {
        const props = (error as { properties?: { errors?: Array<{ message: string, properties?: { xtag?: string, offset?: number } }> } }).properties
        if (props?.errors && Array.isArray(props.errors)) {
          const issues = props.errors.map(e => {
            const tag = e.properties?.xtag || 'unknown'
            const offset = e.properties?.offset || 0
            return `${e.message} at position ${offset}: "${tag}"`
          })
          
          return NextResponse.json({ 
            error: 'Word document has formatting issues with placeholders', 
            details: `The placeholders in the Word document are split by formatting. This happens when Word adds formatting (bold, italic, etc.) in the middle of a placeholder. Please fix these issues:\n\n${issues.join('\n')}\n\nTo fix: Delete and retype the placeholder without formatting, or copy-paste from a plain text editor.`
          }, { status: 400 })
        }
      }
      
      return NextResponse.json({ 
        error: 'Failed to parse Word document', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, { status: 500 })
    }

    // Prepare data for template replacement
    const templateData: Record<string, string> = {}
    
    // Map form fields to template placeholders
    // Handle "ask receiver to fill" fields
    if (formData.party_a_ask_receiver_fill) {
      templateData.party_a_name = '[To be filled by receiving party]'
      templateData.party_a_address = '[To be filled by receiving party]'
      templateData.party_a_email = '[To be filled by receiving party]'
      templateData.party_a_signatory_name = '[To be filled by receiving party]'
      templateData.party_a_title = '[To be filled by receiving party]'
    } else {
      templateData.party_a_name = formData.party_a_name || ''
      templateData.party_a_address = formData.party_a_address || ''
      templateData.party_a_email = formData.party_a_email || ''
      templateData.party_a_signatory_name = formData.party_a_signatory_name || ''
      templateData.party_a_title = formData.party_a_title || ''
    }

    if (formData.party_b_ask_receiver_fill) {
      templateData.party_b_name = '[To be filled by receiving party]'
      templateData.party_b_address = '[To be filled by receiving party]'
      templateData.party_b_email = '[To be filled by receiving party]'
      templateData.party_b_signatory_name = '[To be filled by receiving party]'
      templateData.party_b_title = '[To be filled by receiving party]'
    } else {
      templateData.party_b_name = formData.party_b_name || ''
      templateData.party_b_address = formData.party_b_address || ''
      templateData.party_b_email = formData.party_b_email || ''
      templateData.party_b_signatory_name = formData.party_b_signatory_name || ''
      templateData.party_b_title = formData.party_b_title || ''
    }

    // Add other fields
    templateData.docName = formData.docName || 'Mutual Non-Disclosure Agreement'
    templateData.effective_date = formData.effective_date || new Date().toLocaleDateString()
    templateData.term_months = formData.term_months || ''
    templateData.confidentiality_period_months = formData.confidentiality_period_months || ''
    templateData.governing_law = formData.governing_law || ''
    templateData.ip_ownership = formData.ip_ownership || ''
    templateData.non_solicit = formData.non_solicit || ''
    templateData.exclusivity = formData.exclusivity || ''
    
    // Handle clauses
    if (formData.include_non_compete === 'yes') {
      templateData.non_compete_clause = formData.non_compete_details || ''
    } else {
      templateData.non_compete_clause = 'N/A'
    }

    if (formData.include_dispute_resolution === 'yes') {
      templateData.dispute_resolution_clause = formData.dispute_resolution_method || ''
    } else {
      templateData.dispute_resolution_clause = 'N/A'
    }

    if (formData.include_termination_clause === 'yes') {
      templateData.termination_clause = formData.termination_conditions || ''
    } else {
      templateData.termination_clause = 'N/A'
    }

    console.log('📝 Template data:', templateData)

    // Set the template data
    doc.setData(templateData)

    // Render the document (replace all occurrences of {placeholder})
    try {
      doc.render()
    } catch (error: unknown) {
      console.error('❌ Template rendering error:', error)
      return NextResponse.json({ 
        error: 'Template rendering failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 })
    }

    // Generate the filled document as a buffer
    const buf = doc.getZip().generate({ 
      type: 'nodebuffer',
      compression: 'DEFLATE'
    })

    // Convert to base64 for sending to client
    const base64 = buf.toString('base64')
    const dataUrl = `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${base64}`

    console.log('✅ DOCX generated successfully')

    return NextResponse.json({ 
      fileUrl: dataUrl,
      fileName: `${formData.docName || 'NDA'}.docx`
    })

  } catch (error) {
    console.error('❌ Error filling DOCX:', error)
    return NextResponse.json({ 
      error: 'Failed to fill DOCX', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
