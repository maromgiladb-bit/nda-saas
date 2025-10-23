import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await currentUser()
    const userEmail = user?.emailAddresses?.[0]?.emailAddress || `user-${userId}@example.com`

    const { draftId, title, data } = await request.json()

    // Ensure user exists in database
    let dbUser = await prisma.users.findUnique({
      where: { external_id: userId }
    })

    if (!dbUser) {
      // Create user if doesn't exist
      dbUser = await prisma.users.create({
        data: {
          external_id: userId,
          email: userEmail,
        }
      })
    }

    // Ensure default organization exists
    let organization = await prisma.organizations.findFirst()
    if (!organization) {
      organization = await prisma.organizations.create({
        data: {
          name: 'Default Organization'
        }
      })
    }

    // Ensure default template exists
    let template = await prisma.nda_templates.findFirst({
      where: { organization_id: organization.id }
    })
    if (!template) {
      template = await prisma.nda_templates.create({
        data: {
          name: 'Default NDA Template',
          storage_key: 'default-template',
          organization_id: organization.id
        }
      })
    }

    let draft
    if (draftId) {
      // Update existing draft
      draft = await prisma.nda_drafts.update({
        where: { id: draftId, created_by_id: dbUser.id },
        data: { title, data, updated_at: new Date() }
      })
    } else {
      // Create new draft
      draft = await prisma.nda_drafts.create({
        data: {
          created_by_id: dbUser.id,
          title: title || 'Untitled NDA',
          data,
          status: 'DRAFT',
          template_id: template.id,
          organization_id: organization.id
        }
      })
    }

    return NextResponse.json({ draftId: draft.id, draft })
  } catch (error) {
    console.error('Draft save error:', error)
    return NextResponse.json({ 
      error: 'Failed to save draft', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

export async function GET() {
  console.log('=== GET /api/ndas/drafts called ===')
  
  try {
    console.log('1. Starting GET request')
    
    const { userId } = await auth()
    console.log('2. Auth result - userId:', userId)
    
    if (!userId) {
      console.log('3. No userId - returning 401')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('4. Looking for user in database')
    const dbUser = await prisma.users.findUnique({
      where: { external_id: userId }
    })
    console.log('5. Database user found:', dbUser)

    if (!dbUser) {
      console.log('6. No dbUser found - returning empty drafts')
      return NextResponse.json({ drafts: [] })
    }

    console.log('7. Fetching drafts for user:', dbUser.id)
    const drafts = await prisma.nda_drafts.findMany({
      where: { created_by_id: dbUser.id },
      orderBy: { updated_at: 'desc' },
      include: {
        signers: {
          select: {
            id: true,
            email: true,
            role: true,
            status: true,
            signed_at: true,
            created_at: true
          }
        }
      }
    })
    console.log('8. Found drafts:', drafts.length, 'items')
    console.log('8a. Drafts breakdown by status:')
    const statusCounts = drafts.reduce((acc, d) => {
      acc[d.status || 'UNKNOWN'] = (acc[d.status || 'UNKNOWN'] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    console.log(statusCounts)

    return NextResponse.json({ drafts })
  } catch (error) {
    console.error('=== Draft fetch error ===', error)
    return NextResponse.json({ 
      error: 'Failed to fetch drafts',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}