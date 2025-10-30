import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import mammoth from 'mammoth'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { base64Data } = await request.json()
    
    if (!base64Data) {
      return NextResponse.json({ error: 'No data provided' }, { status: 400 })
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64')

    // Convert DOCX to HTML using mammoth
    const result = await mammoth.convertToHtml({ buffer })
    
    console.log('✅ DOCX converted to HTML')

    return NextResponse.json({ 
      html: result.value,
      messages: result.messages
    })

  } catch (error) {
    console.error('❌ Error converting DOCX to HTML:', error)
    return NextResponse.json({ 
      error: 'Failed to convert DOCX to HTML', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
