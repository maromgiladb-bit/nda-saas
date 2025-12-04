import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { email } = await request.json()

    // 1. Find or Create User
    let user = await prisma.user.findUnique({
      where: { externalId: userId },
      include: { memberships: true }
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          externalId: userId,
          email: email
        },
        include: { memberships: true }
      })
    }

    // 2. Check Memberships
    if (user.memberships.length > 0) {
      // User already has an organization, return user info
      return NextResponse.json({ user })
    }

    // 3. Create Organization (if no memberships)
    // Generate a slug from email (e.g., "john.doe" from "john.doe@example.com")
    const name = email.split('@')[0]
    let slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-')

    // Ensure uniqueness (simple check, can be improved with loop if needed)
    const existingOrg = await prisma.organization.findUnique({ where: { slug } })
    if (existingOrg) {
      slug = `${slug}-${Math.floor(Math.random() * 1000)}`
    }

    const org = await prisma.organization.create({
      data: {
        name: name,
        slug: slug,
        ownerUserId: user.id,
        memberships: {
          create: {
            userId: user.id,
            role: 'OWNER'
          }
        }
      }
    })

    return NextResponse.json({ user, organization: org })

  } catch (error) {
    console.error('User sync error:', error)
    return NextResponse.json({ error: 'Failed to sync user' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { externalId: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('User fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}