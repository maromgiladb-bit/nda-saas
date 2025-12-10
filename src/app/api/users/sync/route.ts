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
    // First try by externalId (Clerk ID)
    let user = await prisma.user.findUnique({
      where: { externalId: userId },
      include: { memberships: true }
    })

    // If not found by ID, try by Email (Invited user case)
    if (!user) {
      const existingUserByEmail = await prisma.user.findUnique({
        where: { email },
        include: { memberships: true }
      })

      if (existingUserByEmail) {
        // Link the Clerk Account to the existing invited user
        user = await prisma.user.update({
          where: { id: existingUserByEmail.id },
          data: { externalId: userId }, // Update placeholder ID with real Clerk ID
          include: { memberships: true }
        })
      } else {
        // Create new user if absolutely no record exists
        user = await prisma.user.create({
          data: {
            externalId: userId,
            email: email
          },
          include: { memberships: true }
        })
      }
    }

    // 2. Check Memberships
    if (user.memberships.length > 0) {
      // User already has an organization (was invited or already exists), return user info
      return NextResponse.json({ user })
    }

    // 3. Create Organization (if no memberships) - ONLY for completely new users
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