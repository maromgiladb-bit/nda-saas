import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'
import { sendEmail, recipientEditEmailHtml, getAppUrl } from '@/lib/email'

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { draftId, signerEmail, signerRole } = body

    if (!draftId || !signerEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate email format
    if (!EMAIL_REGEX.test(signerEmail)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    // Get user to verify ownership
    const user = await prisma.users.findUnique({
      where: { external_id: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update draft status to SENT
    const draft = await prisma.nda_drafts.update({
      where: { 
        id: draftId,
        created_by_id: user.id
      },
      data: { status: 'SENT' }
    })

    // Create signer record
    const signer = await prisma.signers.create({
      data: {
        draft_id: draftId,
        email: signerEmail,
        role: signerRole || 'Party B',
        status: 'PENDING'
      }
    })

    // Create sign request - temporarily without scope until Prisma regenerates
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30) // 30 days

    await prisma.sign_requests.create({
      data: {
        signer_id: signer.id,
        token: token,
        expires_at: expiresAt
      }
    })

    // Create audit event
    await prisma.audit_events.create({
      data: {
        organization_id: draft.organization_id,
        draft_id: draft.id,
        actor_user_id: user.id,
        type: 'NDA_SENT',
        meta: {
          recipient_email: signerEmail,
          recipient_role: signerRole || 'Party B'
        }
      }
    })

    // Send email notification to signer
    const signLink = `${getAppUrl()}/sign/${token}`
    console.log('📧 Preparing to send email to:', signerEmail)
    console.log('📧 Sign link:', signLink)
    console.log('📧 Draft title:', draft.title)
    
    try {
      await sendEmail({
        to: signerEmail,
        subject: `Please review & sign your NDA – ${draft.title || 'NDA'}`,
        html: recipientEditEmailHtml(draft.title || 'Untitled NDA', signLink)
      })
      console.log('✅ Email sent successfully in send route')
    } catch (emailError) {
      console.error('❌ Failed to send email notification:', emailError)
      console.error('❌ Email error details:', emailError)
      // Don't fail the request if email fails, but log it
    }

    return NextResponse.json({ 
      success: true,
      draft,
      signer,
      signRequest: {
        token,
        link: `/sign/${token}`
      }
    })
  } catch (error) {
    console.error('Send for signature error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to send for signature' 
    }, { status: 500 })
  }
}