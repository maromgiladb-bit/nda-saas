import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('=== GET /api/ndas/drafts/[id] ===')
  try {
    const { userId } = await auth()
    console.log('Auth userId:', userId)
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find user in database
    const dbUser = await prisma.users.findUnique({
      where: { external_id: userId }
    })
    console.log('Database user found:', dbUser)

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const id = params.id
    console.log('Draft ID:', id)

    const draft = await prisma.nda_drafts.findUnique({
      where: { 
        id: id,
        created_by_id: dbUser.id 
      },
      include: {
        signers: true
      }
    })
    console.log('Draft found:', draft ? 'Yes' : 'No')

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    }

    return NextResponse.json({ draft })
  } catch (error) {
    console.error('Draft fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch draft' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('=== PUT /api/ndas/drafts/[id] ===')
  
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find user in database
    const dbUser = await prisma.users.findUnique({
      where: { external_id: userId }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { title, data } = await request.json()

    const draft = await prisma.nda_drafts.update({
      where: { 
        id: params.id,
        created_by_id: dbUser.id 
      },
      data: { 
        title, 
        data,
        updated_at: new Date()
      }
    })

    return NextResponse.json({ draft })
  } catch (error) {
    console.error('Draft update error:', error)
    return NextResponse.json({ error: 'Failed to update draft' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('=== DELETE /api/ndas/drafts/[id] ===')
  
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find user in database
    const dbUser = await prisma.users.findUnique({
      where: { external_id: userId }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    await prisma.nda_drafts.delete({
      where: { 
        id: params.id,
        created_by_id: dbUser.id 
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Draft delete error:', error)
    return NextResponse.json({ error: 'Failed to delete draft' }, { status: 500 })
  }
}