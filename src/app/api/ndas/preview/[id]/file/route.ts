import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import fs from 'fs'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user owns this draft
    const user = await prisma.user.findUnique({
      where: { externalId: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const draft = await prisma.ndaDraft.findUnique({
      where: {
        id: params.id,
        createdByUserId: user.id
      }
    })

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    }

    // Read PDF file from tmp folder
    const tmpDir = path.join(process.cwd(), 'tmp')
    const filename = `nda-preview-${params.id}.pdf`
    const filepath = path.join(tmpDir, filename)

    if (!fs.existsSync(filepath)) {
      return NextResponse.json({
        error: 'PDF not found. Please generate preview first.'
      }, { status: 404 })
    }

    const pdfBuffer = fs.readFileSync(filepath)

    // Return PDF with proper headers
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${draft.title || 'NDA'}.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })

  } catch (error) {
    console.error('❌ Error serving PDF:', error)
    return NextResponse.json({
      error: 'Failed to serve PDF',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
