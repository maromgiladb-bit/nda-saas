import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { PDFDocument } from 'pdf-lib'
import fs from 'fs'
import { templateManager } from '@/lib/template-manager'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.json()
    console.log('📄 PDF Fill Request - Fields:', Object.keys(formData))

    // Load template configuration
    const config = templateManager.loadConfig()
    console.log('📋 Using template:', config.templateName)

    // Validate data
    const validation = templateManager.validateData(formData)
    if (!validation.valid) {
      console.error('❌ Validation failed:', JSON.stringify(validation.errors, null, 2))
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validation.errors 
      }, { status: 400 })
    }
    console.log('✅ Validation passed')

    // Get template PDF path
    const templatePath = templateManager.getTemplatePath()
    
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json({ 
        error: 'Template not found', 
        details: `Template file ${config.templateFile} not found in /public/pdfs/` 
      }, { status: 404 })
    }

    // Load PDF
    const existingPdfBytes = fs.readFileSync(templatePath)
    const pdfDoc = await PDFDocument.load(existingPdfBytes)

    // Check fill mode (form fields vs text overlay)
    let filledCount = 0
    
    if (config.fillMode === 'overlay') {
      // TEXT OVERLAY MODE - Draw text directly on pages (for PDFs without form fields)
      console.log('📝 Using TEXT OVERLAY mode')
      
      // Check if receiver should fill party A or B fields
      const partyAReceiverFills = formData.party_a_ask_receiver_fill === true
      const partyBReceiverFills = formData.party_b_ask_receiver_fill === true
      
      for (const [fieldKey, fieldConfig] of Object.entries(config.fields)) {
        if (!fieldConfig.pdfPosition) continue
        
        const value = formData[fieldKey]
        const { page: pageIndex, x, y } = fieldConfig.pdfPosition
        const { section } = fieldConfig
        
        try {
          const page = pdfDoc.getPages()[pageIndex]
          const { rgb } = await import('pdf-lib')
          
          let displayValue = ''
          let textColor = rgb(0, 0, 0) // Default black
          let textSize = 10
          
          // Determine if this field should show placeholder text
          const shouldShowPlaceholder = 
            (section === 'party_a' && partyAReceiverFills) ||
            (section === 'party_b' && partyBReceiverFills)
          
          if (shouldShowPlaceholder) {
            // Show placeholder text for receiver to fill
            displayValue = '[To be filled by receiving party]'
            textColor = rgb(0.5, 0.5, 0.5) // Gray color for placeholder
            textSize = 9
            console.log(`📝 Placeholder added for ${fieldKey}`)
          } else if (value) {
            // Format the actual value
            displayValue = String(value)
            if (fieldConfig.type === 'date' && value) {
              displayValue = new Date(value).toLocaleDateString()
            }
            console.log(`✏️  Drew "${displayValue}" for ${fieldKey}`)
          }
          
          // Draw text on the page if we have something to display
          if (displayValue) {
            page.drawText(displayValue, {
              x,
              y,
              size: textSize,
              color: textColor,
            })
            filledCount++
          }
        } catch (e) {
          console.warn(`⚠️  Could not draw field ${fieldKey}:`, e)
        }
      }
      
      console.log(`✅ Drew ${filledCount} fields using text overlay`)
      
    } else {
      // FORM FIELD MODE - Fill actual PDF form fields (traditional approach)
      console.log('📝 Using FORM FIELD mode')
      
      const form = pdfDoc.getForm()
      const fields = form.getFields()
      
      console.log('📝 Available PDF fields:', fields.map(f => f.getName()))

      // Check if receiver should fill party A or B fields
      const partyAReceiverFills = formData.party_a_ask_receiver_fill === true
      const partyBReceiverFills = formData.party_b_ask_receiver_fill === true

      // Map form data to PDF fields
      const mappedData = templateManager.mapDataToPDFFields(formData)
      console.log('🗺️  Mapped data:', Object.keys(mappedData))

      // Fill form fields
      Object.entries(mappedData).forEach(([fieldName, value]) => {
        try {
          const field = form.getTextField(fieldName)
          
          // Find the field config to check its section
          const fieldConfig = Object.entries(config.fields).find(
            ([, cfg]) => cfg.pdfFieldName === fieldName
          )?.[1]
          
          const shouldShowPlaceholder = 
            (fieldConfig?.section === 'party_a' && partyAReceiverFills) ||
            (fieldConfig?.section === 'party_b' && partyBReceiverFills)
          
          if (shouldShowPlaceholder) {
            // Set placeholder text
            field.setText('[To be filled by receiving party]')
            console.log(`📝 Placeholder set for ${fieldName}`)
          } else {
            // Set actual value
            field.setText(String(value))
          }
          
          filledCount++
        } catch (e) {
          // If field doesn't exist as text field, try other types or skip
          console.warn(`⚠️  Could not fill field: ${fieldName}`, e)
        }
      })

      console.log(`✅ Filled ${filledCount} of ${Object.keys(mappedData).length} fields`)

      // Flatten form (make it non-editable)
      form.flatten()
    }

    // Save PDF
    const pdfBytes = await pdfDoc.save()
    
    // Convert to base64
    const base64 = Buffer.from(pdfBytes).toString('base64')
    const dataUrl = `data:application/pdf;base64,${base64}`

    return NextResponse.json({ 
      fileUrl: dataUrl,
      metadata: {
        template: config.templateName,
        fieldsF: filledCount,
        totalFields: Object.keys(config.fields).length,
        fillMode: config.fillMode || 'formFields'
      }
    })

  } catch (error) {
    console.error('❌ PDF fill error:', error)
    return NextResponse.json({ 
      error: 'Failed to fill PDF',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
