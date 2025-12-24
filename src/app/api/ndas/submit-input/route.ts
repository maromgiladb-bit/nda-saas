import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail, ownerReviewEmailHtml, getAppUrl } from '@/lib/email'

/**
 * Submit filled fields from Party B (public, no auth required)
 * POST /api/ndas/submit-input
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { signerId, draftId, filledFields, suggestedChanges } = body

        if (!signerId || !draftId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Find signer
        const signer = await prisma.signer.findUnique({
            where: { id: signerId },
            include: {
                signRequest: {
                    include: {
                        draft: true,
                        createdBy: true,
                    }
                }
            }
        })

        if (!signer) {
            return NextResponse.json({ error: 'Invalid signer' }, { status: 404 })
        }

        const draft = signer.signRequest.draft

        // Verify draft is in correct state
        if (draft.workflowState !== 'AWAITING_INPUT') {
            return NextResponse.json({
                error: 'Draft is not awaiting input'
            }, { status: 400 })
        }

        // Merge filled fields into draft content
        const currentContent = (draft.content as Record<string, unknown>) || {}
        const newContent = {
            ...currentContent,
            ...filledFields,
            // Clear the "ask receiver" flags for filled fields
            ...Object.keys(filledFields).reduce((acc, field) => {
                acc[`${field}_ask_receiver`] = false
                return acc
            }, {} as Record<string, boolean>)
        }

        // Create revision to track changes
        const revision = await prisma.ndaRevision.create({
            data: {
                draftId: draft.id,
                content: {
                    filledFields,
                    suggestedChanges,
                    submittedBy: signer.email,
                    submittedAt: new Date().toISOString()
                }
            }
        })

        // Determine new workflow state based on whether there are suggestions
        const hasSuggestions = suggestedChanges &&
            Object.values(suggestedChanges).some(v => v && (v as string).trim())

        const newWorkflowState = hasSuggestions ? 'REVIEWING_CHANGES' : 'READY_TO_SIGN'

        // Update draft
        await prisma.ndaDraft.update({
            where: { id: draft.id },
            data: {
                content: newContent,
                workflowState: newWorkflowState,
                pendingInputFields: [] // Clear pending fields
            }
        })

        // Update signer status
        await prisma.signer.update({
            where: { id: signerId },
            data: { status: 'VIEWED' }
        })

        // Link revision to sign request
        await prisma.signRequest.update({
            where: { id: signer.signRequestId },
            data: { revisionId: revision.id }
        })

        // Create audit event
        await prisma.auditEvent.create({
            data: {
                organizationId: draft.organizationId,
                draftId: draft.id,
                signRequestId: signer.signRequestId,
                signerId: signer.id,
                eventType: 'UPDATED',
                metadata: {
                    action: 'party_b_submitted_input',
                    filled_fields: Object.keys(filledFields),
                    has_suggestions: hasSuggestions
                }
            }
        })

        // Email owner about the submission
        const owner = signer.signRequest.createdBy
        const reviewLink = hasSuggestions
            ? `${getAppUrl()}/review-changes/${draft.id}`
            : `${getAppUrl()}/fillndahtml?draftId=${draft.id}&action=send-for-signature`

        try {
            const changes = Object.entries(filledFields).map(([field, value]) => ({
                field: field.replace(/_/g, ' ').replace('party b ', ''),
                before: (currentContent[field] as string) || '(empty)',
                after: value as string
            }))

            await sendEmail({
                to: owner.email,
                subject: hasSuggestions
                    ? `Review Required: Changes to ${draft.title || 'NDA'}`
                    : `Ready for Signature: ${draft.title || 'NDA'} - Party B provided information`,
                html: hasSuggestions
                    ? ownerReviewEmailHtml(
                        draft.title || 'Untitled NDA',
                        1, // revision number
                        reviewLink,
                        changes.slice(0, 5)
                    )
                    : completedInputEmailHtml(draft.title || 'Untitled NDA', reviewLink, signer.email)
            })
            console.log('✅ Owner notification email sent')
        } catch (emailError) {
            console.error('❌ Failed to send owner notification:', emailError)
        }

        return NextResponse.json({
            success: true,
            newWorkflowState,
            hasSuggestions,
            revisionId: revision.id
        })
    } catch (error) {
        console.error('Submit input error:', error)
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Failed to submit input'
        }, { status: 500 })
    }
}

// Email template when input is complete (no suggestions)
function completedInputEmailHtml(
    draftTitle: string,
    reviewLink: string,
    signerEmail: string
): string {
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
          .content { background: #f9fafb; padding: 30px; border-radius: 8px; margin-bottom: 20px; }
          .button { display: inline-block; background: linear-gradient(135deg, #16a34a, #15803d); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
          .success { color: #16a34a; font-size: 48px; text-align: center; margin-bottom: 20px; }
          .footer { text-align: center; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Formalize It</div>
          </div>
          <div class="content">
            <div class="success">✓</div>
            <h2 style="text-align: center;">Information Received</h2>
            <p><strong>${draftTitle}</strong></p>
            <p>${signerEmail} has provided all requested information for your NDA. The document is now ready to send for signatures.</p>
            <a href="${reviewLink}" class="button">Review & Send for Signature</a>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Formalize It. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `
}
