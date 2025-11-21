import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

const FREE_PLAN_LIMIT = 3

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await prisma.users.findUnique({
      where: { external_id: userId }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get count of NDAs created by user
    const ndaCount = await prisma.nda_drafts.count({
      where: { created_by_id: dbUser.id }
    })

    const plan = dbUser.plan || 'FREE'
    
    // Developer and Pro plans have unlimited access
    const canCreate = plan === 'DEVELOPER' || plan === 'PRO' || plan === 'ENTERPRISE' || (plan === 'FREE' && ndaCount < FREE_PLAN_LIMIT)

    return NextResponse.json({
      plan,
      ndaCount,
      limit: plan === 'FREE' ? FREE_PLAN_LIMIT : null,
      canCreate,
      remaining: plan === 'FREE' ? Math.max(0, FREE_PLAN_LIMIT - ndaCount) : null
    })
  } catch (error) {
    console.error('Check limit error:', error)
    return NextResponse.json({
      error: 'Failed to check limit',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
