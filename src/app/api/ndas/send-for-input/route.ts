import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { sendEmail, getAppUrl } from '@/lib/email'

/**
 * Send NDA for Party B input (not signature)
 * Used when Party A has marked fields as "ask receiver to fill"
 * POST /api/ndas/send-for-input
 */
export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { draftId, recipientEmail, recipientName, message } = body

        if (!draftId || !recipientEmail) {
            return NextResponse.json({ error: 'Missing required fields: draftId, recipientEmail' }, { status: 400 })
        }

        // Get user
        const user = await prisma.user.findUnique({
            where: { externalId: userId }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Get draft and verify ownership
        const draft = await prisma.ndaDraft.findUnique({
            where: {
                id: draftId,
                createdByUserId: user.id
            }
        })

        if (!draft) {
            return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
        }

        // Extract which fields are marked for receiver to fill
        const content = (draft.content as Record<string, unknown>) || {}
        const pendingInputFields: string[] = []

        // Check each "ask receiver" flag
        const askReceiverFields = [
            { flag: 'party_b_name_ask_receiver', field: 'party_b_name', label: 'Company/Party Name' },
            { flag: 'party_b_address_ask_receiver', field: 'party_b_address', label: 'Address' },
            { flag: 'party_b_phone_ask_receiver', field: 'party_b_phone', label: 'Phone' },
            { flag: 'party_b_signatory_name_ask_receiver', field: 'party_b_signatory_name', label: 'Signatory Name' },
            { flag: 'party_b_title_ask_receiver', field: 'party_b_title', label: 'Signatory Title' },
            { flag: 'party_b_email_ask_receiver', field: 'party_b_email', label: 'Email' },
        ]

        for (const { flag, field, label } of askReceiverFields) {
            if (content[flag] === true) {
                pendingInputFields.push(field)
            }
        }

        if (pendingInputFields.length === 0) {
            return NextResponse.json({
                error: 'No fields marked for receiver to fill. Use send-for-signature instead.'
            }, { status: 400 })
        }

        // Create a SignRequest for tracking
        const signRequest = await prisma.signRequest.create({
            data: {
                organizationId: draft.organizationId,
                draftId: draftId,
                createdByUserId: user.id,
                status: 'PENDING',
            }
        })

        // Create Signer record
        const signer = await prisma.signer.create({
            data: {
                signRequestId: signRequest.id,
                email: recipientEmail,
                name: recipientName || null,
                role: 'SIGNER',
                status: 'PENDING'
            }
        })

        // Update draft with workflow state
        await prisma.ndaDraft.update({
            where: { id: draftId },
            data: {
                workflowState: 'AWAITING_INPUT',
                pendingInputFields: pendingInputFields,
                recipientEmail: recipientEmail,
                status: 'SENT'
            }
        })

        // Create audit event
        await prisma.auditEvent.create({
            data: {
                organizationId: draft.organizationId,
                draftId: draft.id,
                userId: user.id,
                eventType: 'SENT',
                metadata: {
                    action: 'send_for_input',
                    recipient_email: recipientEmail,
                    pending_fields: pendingInputFields
                }
            }
        })

        // Send email to recipient
        const inputLink = `${getAppUrl()}/fillndahtml-public/${signer.id}`
        console.log('📧 Sending input request to:', recipientEmail)
        console.log('📧 Fill link:', inputLink)

        try {
            await sendEmail({
                to: recipientEmail,
                subject: `Action Required: Please complete your information - ${draft.title || 'NDA'}`,
                html: inputRequestEmailHtml(
                    draft.title || 'Untitled NDA',
                    inputLink,
                    pendingInputFields.length,
                    message || 'Please fill in the requested information to complete this NDA.'
                )
            })
            console.log('✅ Input request email sent')
        } catch (emailError) {
            console.error('❌ Failed to send email:', emailError)
            // Don't fail the request
        }

        return NextResponse.json({
            success: true,
            draft: { id: draft.id, workflowState: 'AWAITING_INPUT' },
            signer: { id: signer.id, email: recipientEmail },
            inputLink,
            pendingFieldsCount: pendingInputFields.length
        })
    } catch (error) {
        console.error('Send for input error:', error)
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Failed to send for input'
        }, { status: 500 })
    }
}

// Email template for input request
function inputRequestEmailHtml(
    draftTitle: string,
    inputLink: string,
    fieldCount: number,
    message: string
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
          .button { display: inline-block; background: linear-gradient(135deg, #2563eb, #9333ea); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
          .badge { display: inline-block; background: #fbbf24; color: #78350f; padding: 4px 12px; border-radius: 999px; font-size: 14px; font-weight: 600; }
          .message { background: white; padding: 15px; border-left: 4px solid #2563eb; margin: 15px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Formalize It</div>
          </div>
          <div class="content">
            <h2>Complete Your Information</h2>
            <p><strong>${draftTitle}</strong></p>
            <p>You've been asked to provide information for an NDA. <span class="badge">${fieldCount} field${fieldCount > 1 ? 's' : ''} to fill</span></p>
            <div class="message">${message}</div>
            <p>Click the button below to review the NDA and fill in your information:</p>
            <a href="${inputLink}" class="button">Complete NDA Information</a>
            <p style="color: #6b7280; font-size: 14px;">This link will expire in 30 days. No account required.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Formalize It. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `
}
