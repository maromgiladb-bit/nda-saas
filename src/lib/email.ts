import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const APP_URL = process.env.APP_URL || 'http://localhost:3000'
const MAIL_FROM = process.env.MAIL_FROM || 'noreply@agreedo.app'

export interface EmailAttachment {
  filename: string
  content: string // Base64 string
  contentType?: string
}

export interface SendEmailParams {
  to: string
  subject: string
  html: string
  attachments?: EmailAttachment[]
}

export async function sendEmail({ to, subject, html, attachments }: SendEmailParams): Promise<void> {
  console.log('📧 sendEmail called with:', { to, subject, hasHtml: !!html, attachmentCount: attachments?.length || 0 })
  console.log('📧 RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY)
  console.log('📧 MAIL_FROM:', MAIL_FROM)
  console.log('📧 APP_URL:', APP_URL)
  
  if (!resend) {
    console.warn('⚠️  Email not sent: RESEND_API_KEY not configured. Set it in .env to enable email notifications.')
    return
  }
  
  try {
    console.log('📧 Attempting to send email via Resend...')
    
    // Prepare attachments in Resend format
    const resendAttachments = attachments?.map(att => ({
      filename: att.filename,
      content: att.content, // Base64 string
      contentType: att.contentType || 'application/octet-stream'
    }))
    
    const { data, error } = await resend.emails.send({
      from: MAIL_FROM,
      to,
      subject,
      html,
      replyTo: MAIL_FROM,
      attachments: resendAttachments
    })
    
    if (error) {
      console.error('❌ Resend API Error:', error)
      if (error.message?.includes('You can only send testing emails')) {
        console.error('⚠️  IMPORTANT: You are using Resend test domain (onboarding@resend.dev)')
        console.error('⚠️  Test domain can ONLY send to your verified email address')
        console.error('⚠️  To send to other recipients:')
        console.error('   1. Go to https://resend.com/domains')
        console.error('   2. Verify your own domain')
        console.error('   3. Update MAIL_FROM in .env.local to use your domain')
      }
      throw new Error(error.message || 'Email sending failed')
    }
    
    console.log('✅ Email sent successfully!', data)
    console.log('✅ Email sent to:', to)
  } catch (error) {
    console.error('❌ Failed to send email:', error)
    console.error('❌ Error details:', JSON.stringify(error, null, 2))
    throw error
  }
}

export function getAppUrl(): string {
  return APP_URL
}

// Email templates

export function recipientEditEmailHtml(
  draftTitle: string,
  editLink: string,
  ownerMessage?: string
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
          .message { background: white; padding: 15px; border-left: 4px solid #fbbf24; margin: 15px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">agreedo</div>
          </div>
          <div class="content">
            <h2>Review & Edit Your NDA</h2>
            <p>You've been invited to review and edit the following NDA:</p>
            <p><strong>${draftTitle}</strong></p>
            ${ownerMessage ? `<div class="message"><strong>Message from sender:</strong><br>${ownerMessage}</div>` : ''}
            <p>Click the button below to review, make changes, and submit:</p>
            <a href="${editLink}" class="button">Review & Edit NDA</a>
            <p style="color: #6b7280; font-size: 14px;">This link will expire in 30 days.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} agreedo. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `
}

export function ownerReviewEmailHtml(
  draftTitle: string,
  revisionNumber: number,
  reviewLink: string,
  changes: Array<{ field: string; before: string; after: string }>
): string {
  const changesList = changes.slice(0, 5).map(c => 
    `<li><strong>${c.field}:</strong> <span style="color: #dc2626;">${c.before || '(empty)'}</span> → <span style="color: #16a34a;">${c.after || '(removed)'}</span></li>`
  ).join('')
  
  const moreChanges = changes.length > 5 ? `<p style="color: #6b7280;">...and ${changes.length - 5} more changes</p>` : ''
  
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
          .changes { background: white; padding: 20px; border-radius: 6px; margin: 15px 0; }
          .changes ul { margin: 10px 0; padding-left: 20px; }
          .changes li { margin: 8px 0; }
          .badge { display: inline-block; background: #fbbf24; color: #78350f; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
          .footer { text-align: center; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">agreedo</div>
          </div>
          <div class="content">
            <h2>Review Requested: Changes to NDA <span class="badge">R${revisionNumber}</span></h2>
            <p><strong>${draftTitle}</strong></p>
            <p>The recipient has submitted changes for your review.</p>
            <div class="changes">
              <h3>Key Changes:</h3>
              <ul>${changesList}</ul>
              ${moreChanges}
            </div>
            <p>Review all changes and decide whether to approve or request further modifications:</p>
            <a href="${reviewLink}" class="button">Review Changes</a>
            <p style="color: #6b7280; font-size: 14px;">This link will expire in 30 days.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} agreedo. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `
}

export function finalSignedEmailHtml(
  draftTitle: string,
  downloadLink: string
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
          .content { background: #f9fafb; padding: 30px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
          .success { color: #16a34a; font-size: 48px; margin-bottom: 20px; }
          .button { display: inline-block; background: linear-gradient(135deg, #2563eb, #9333ea); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">agreedo</div>
          </div>
          <div class="content">
            <div class="success">✓</div>
            <h2>Fully Signed NDA – Download</h2>
            <p><strong>${draftTitle}</strong></p>
            <p>Congratulations! Your NDA has been fully signed by all parties.</p>
            <a href="${downloadLink}" class="button">Download Final PDF</a>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} agreedo. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `
}

export function recipientSignRequestEmailHtml(
  draftTitle: string,
  signLink: string
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
          .footer { text-align: center; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">agreedo</div>
          </div>
          <div class="content">
            <h2>Please Review & Sign Your NDA</h2>
            <p><strong>${draftTitle}</strong></p>
            <p>Your NDA is ready for your signature. Please review the final document and sign.</p>
            <a href="${signLink}" class="button">Review & Sign NDA</a>
            <p style="color: #6b7280; font-size: 14px;">This link will expire in 30 days.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} agreedo. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `
}
