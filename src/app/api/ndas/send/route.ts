import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { draftId, signers } = await request.json()

    // Update draft status to SENT
    const draft = await prisma.nda_drafts.update({
      where: { 
        id: draftId,
        created_by_id: userId 
      },
      data: { status: 'SENT' }
    })

    // Create signer records
    const signerRecords = await Promise.all(
      signers.map((signer: { email: string; role: string }) =>
        prisma.signers.create({
          data: {
            draft_id: draftId,
            email: signer.email,
            role: signer.role,
            status: 'PENDING'
          }
        })
      )
    )

    // Create sign requests for each signer
    const signRequests = await Promise.all(
      signerRecords.map(signer =>
        prisma.sign_requests.create({
          data: {
            signer_id: signer.id,
            token: `sign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
          }
        })
      )
    )

    // TODO: Send email notifications to signers

    return NextResponse.json({ 
      draft,
      signers: signerRecords,
      signRequests
    })
  } catch (error) {
    console.error('Send for signature error:', error)
    return NextResponse.json({ error: 'Failed to send for signature' }, { status: 500 })
  }
}