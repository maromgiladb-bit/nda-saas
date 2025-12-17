import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { createDraftWithLimitCheck } from '@/organizations/limits'

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await req.json()
    const { title, draftId, data } = payload
    // Frontend sends form data in 'data' field, backend stores it as 'content'
    const content = data

    // 1. Get user and memberships
    const dbUser = await prisma.user.findUnique({
      where: { externalId: userId },
      include: {
        memberships: {
          include: { organization: true },
          take: 1
        }
      }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let organizationId: string

    if (dbUser.memberships.length > 0) {
      organizationId = dbUser.memberships[0].organizationId
    } else {
      // Create default org
      const orgName = dbUser.email.split('@')[0]
      const slug = orgName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000)

      const org = await prisma.organization.create({
        data: {
          name: orgName,
          slug: slug,
          ownerUserId: dbUser.id,
          memberships: {
            create: {
              userId: dbUser.id,
              role: 'OWNER'
            }
          }
        }
      })
      organizationId = org.id
    }

    // Ensure default template exists
    let template = await prisma.ndaTemplate.findFirst({
      where: { organizationId: organizationId }
    })
    if (!template) {
      template = await prisma.ndaTemplate.create({
        data: {
          title: 'Default NDA Template',
          content: 'Default content', // Placeholder
          organizationId: organizationId,
          createdByUserId: dbUser.id,
          isDefault: true
        }
      })
    }

    let draft
    if (draftId) {
      // Update existing draft
      draft = await prisma.ndaDraft.update({
        where: { id: draftId, createdByUserId: dbUser.id },
        data: { title, content: content }
      })
    } else {
      // Create new draft - check limits
      draft = await createDraftWithLimitCheck({
        organizationId,
        createdByUserId: dbUser.id,
        templateId: template.id,
        title: title || 'Untitled NDA',
        content: content
      })
    }

    return NextResponse.json({ draft, draftId: draft.id, id: draft.id })

  } catch (error: any) {
    console.error('Draft creation/update error:', error)
    if (error.message && error.message.includes('maximum number of NDAs')) {
      return NextResponse.json({ error: error.message, code: 'LIMIT_REACHED' }, { status: 403 })
    }
    return NextResponse.json({
      error: 'Failed to save draft',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  console.log('=== GET /api/ndas/drafts called ===')

  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { externalId: userId }
    })

    if (!dbUser) {
      return NextResponse.json({ drafts: [] })
    }

    const drafts = await prisma.ndaDraft.findMany({
      where: { createdByUserId: dbUser.id },
      orderBy: { updatedAt: 'desc' },
      include: {
        signRequests: {
          include: {
            signers: true
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    const transformedDrafts = drafts.map(d => ({
      ...d,
      data: d.content, // Map content back to data for frontend compatibility
      signers: d.signRequests[0]?.signers || [] // Flatten signers from latest request
    }))

    return NextResponse.json({ drafts: transformedDrafts })
  } catch (error) {
    console.error('=== Draft fetch error ===', error)
    return NextResponse.json({
      error: 'Failed to fetch drafts',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}