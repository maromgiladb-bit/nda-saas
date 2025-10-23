import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail, finalSignedEmailHtml, recipientSignRequestEmailHtml, getAppUrl } from '@/lib/email'
import { randomBytes } from 'crypto'

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
): Promise<NextResponse> {
  try {
    const token = params.token

    // Validate token
    const signRequest = await prisma.sign_requests.findUnique({
      where: { token },
      include: {
        signers: {
          include: {
            nda_drafts: {
              include: {
                users: true,
                signers: {
                  include: {
                    users: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!signRequest) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
    }

    if (signRequest.consumed_at) {
      return NextResponse.json({ error: 'Token already consumed' }, { status: 400 })
    }

    if (new Date() > signRequest.expires_at) {
      return NextResponse.json({ error: 'Token expired' }, { status: 400 })
    }

    if (signRequest.scope !== 'REVIEW') {
      return NextResponse.json({ error: 'Invalid token scope' }, { status: 403 })
    }

    const draft = signRequest.signers.nda_drafts

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    }

    if (draft.status !== 'PENDING_OWNER_REVIEW') {
      return NextResponse.json(
        { error: 'Draft is not pending owner review' },
        { status: 400 }
      )
    }

    // Check if recipient provisionally signed
    if (draft.provisional_recipient_signed_at) {
      // Both parties signed - finalize
      await prisma.nda_drafts.update({
        where: { id: draft.id },
        data: {
          status: 'SIGNED',
          updated_at: new Date()
        }
      })

      // Mark owner signer as signed
      await prisma.signers.updateMany({
        where: {
          draft_id: draft.id,
          user_id: draft.created_by_id
        },
        data: {
          status: 'SIGNED',
          signed_at: new Date()
        }
      })

      // Mark recipient signer as signed
      await prisma.signers.updateMany({
        where: {
          draft_id: draft.id,
          user_id: { not: draft.created_by_id }
        },
        data: {
          status: 'SIGNED',
          signed_at: draft.provisional_recipient_signed_at
        }
      })

      // Consume token
      await prisma.sign_requests.update({
        where: { id: signRequest.id },
        data: { consumed_at: new Date() }
      })

      // Create audit event
      await prisma.audit_events.create({
        data: {
          organization_id: draft.organization_id,
          draft_id: draft.id,
          actor_user_id: draft.created_by_id,
          type: 'OWNER_APPROVED_AND_SIGNED',
          meta: { finalized: true }
        }
      })

      // TODO: Generate final PDF and store
      const finalPdfUrl = `${getAppUrl()}/api/ndas/${draft.id}/download`

      // Send final signed email to all parties
      const allSigners = draft.signers
      for (const signer of allSigners) {
        await sendEmail({
          to: signer.email,
          subject: `Fully signed NDA – ${draft.title}`,
          html: finalSignedEmailHtml(draft.title || 'Untitled NDA', finalPdfUrl)
        })
      }

      return NextResponse.json({
        ok: true,
        status: 'SIGNED',
        finalized: true
      })
    } else {
      // Recipient hasn't signed yet - mark as ready to sign
      await prisma.nda_drafts.update({
        where: { id: draft.id },
        data: {
          status: 'READY_TO_SIGN',
          last_actor: 'OWNER',
          updated_at: new Date()
        }
      })

      // Create recipient SIGN token
      const recipientSigner = draft.signers.find(s => s.user_id !== draft.created_by_id)
      
      if (recipientSigner) {
        const signToken = randomBytes(32).toString('hex')
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 30)

        await prisma.sign_requests.create({
          data: {
            signer_id: recipientSigner.id,
            token: signToken,
            scope: 'SIGN',
            expires_at: expiresAt
          }
        })

        // Send sign request email
        const signLink = `${getAppUrl()}/sign/${signToken}`
        await sendEmail({
          to: recipientSigner.email,
          subject: `Please review & sign your NDA – ${draft.title}`,
          html: recipientSignRequestEmailHtml(draft.title || 'Untitled NDA', signLink)
        })
      }

      // Create audit event
      await prisma.audit_events.create({
        data: {
          organization_id: draft.organization_id,
          draft_id: draft.id,
          actor_user_id: draft.created_by_id,
          type: 'OWNER_APPROVED',
          meta: { ready_to_sign: true }
        }
      })

      return NextResponse.json({
        ok: true,
        status: 'READY_TO_SIGN'
      })
    }

  } catch (error) {
    console.error('Error approving review:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
