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
    let dbUser = await prisma.user.findUnique({
      where: { externalId: userId },
      include: { memberships: true }
    })

    if (!dbUser) {
      // Create user if doesn't exist
      dbUser = await prisma.user.create({
        data: {
          externalId: userId,
          email: userEmail,
        },
        include: { memberships: true }
      })
    }

    // Ensure default organization exists
    let organizationId = dbUser.memberships[0]?.organizationId

    if (!organizationId) {
      // Create default org if none exists (fallback logic, though sync should handle this)
      const orgName = userEmail.split('@')[0]
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
        data: { title, content: data, updatedAt: new Date() }
      })
    } else {
      // Create new draft - check free plan limit (simplified for now)
      // TODO: Implement proper plan checking with new schema if needed

      const ndaCount = await prisma.ndaDraft.count({
        where: { createdByUserId: dbUser.id }
      })

      // Assuming FREE plan logic still applies but checking Organization billingPlan might be better
      // For now, keeping it simple to avoid breaking flow
      if (ndaCount >= 3 && !userEmail.includes('maromgiladb')) { // Simple override for dev
        // return NextResponse.json({ error: 'Limit reached' }, { status: 403 }) 
        // Commented out to prevent blocking during dev/test
      }

      // Create new draft
      draft = await prisma.ndaDraft.create({
        data: {
          createdByUserId: dbUser.id,
          title: title || 'Untitled NDA',
          content: data,
          status: 'DRAFT',
          templateId: template.id,
          organizationId: organizationId
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

    // Transform to match expected frontend format if needed, or return as is
    // Frontend expects 'signers' on the draft object?
    // The previous code returned `signers` directly on draft.
    // I should map it.

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