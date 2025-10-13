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

    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { external_id: userId }
    })

    if (existingUser) {
      return NextResponse.json({ user: existingUser })
    }

    // Create new user
    const user = await prisma.users.create({
      data: {
        external_id: userId,
        email: email
      }
    })

    return NextResponse.json({ user })
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

    const user = await prisma.users.findUnique({
      where: { external_id: userId }
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