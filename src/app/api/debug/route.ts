import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  console.log('=== UNPROTECTED API TEST ===')
  try {
    // Test basic API functionality without auth
    const testData = {
      message: 'API is working',
      timestamp: new Date().toISOString(),
      database: 'testing...'
    }

    // Test database connection
    const userCount = await prisma.user.count()
    testData.database = `Connected - ${userCount} users in database`

    console.log('Test API success:', testData)
    return NextResponse.json(testData)
  } catch (error) {
    console.error('Test API error:', error)
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}