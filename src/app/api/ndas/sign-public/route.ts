import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { renderNdaHtml } from '@/lib/renderNdaHtml';
import { htmlToPdf } from '@/lib/htmlToPdf';
import { storeNdaPdf } from '@/lib/storeNdaPdf';

export const runtime = 'nodejs'; // Required for Puppeteer

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { signerId, signerName, signerTitle, signatureImage, signatureDate } = body;

        if (!signerId || !signerName || !signerTitle || !signatureImage) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Get signer with related data
        const signer = await prisma.signer.findUnique({
            where: { id: signerId },
            include: {
                signRequest: {
                    include: {
                        draft: true,
                        organization: true,
                        ndaPdfs: true,
                    },
                },
            },
        });

        if (!signer) {
            return NextResponse.json({ error: 'Signer not found' }, { status: 404 });
        }

        if (signer.status === 'SIGNED') {
            return NextResponse.json(
                { error: 'Already signed' },
                { status: 400 }
            );
        }

        // Extract form data from draft
        const draft = signer.signRequest.draft;
        const formData = (draft.content as Record<string, any>) || {};

        // Update draft content with Party B's signature
        const updatedContent = {
            ...formData,
            party_2_signatory_name: signerName,
            party_2_signatory_title: signerTitle,
            party_2_signature_date: signatureDate,
        };

        // Update draft status to SIGNED
        await prisma.ndaDraft.update({
            where: { id: draft.id },
            data: {
                content: updatedContent,
                status: 'SIGNED',
            },
        });

        // Update sign request status to SIGNED
        await prisma.signRequest.update({
            where: { id: signer.signRequestId },
            data: { status: 'SIGNED' },
        });

        // Update signer status
        await prisma.signer.update({
            where: { id: signerId },
            data: {
                status: 'SIGNED',
                name: signerName,
            },
        });

        // Generate PDF with BOTH signatures
        console.log('📄 Generating fully signed PDF...');
        let html = await renderNdaHtml(updatedContent);

        // Inject Party A's signature (from SENT PDF)
        const sentPdf = signer.signRequest.ndaPdfs.find((pdf: any) => pdf.kind === 'SENT');
        if (sentPdf) {
            // Note: Party A's signature should already be in the formData
            // We just need to add Party B's signature
        }

        // Inject Party B's signature
        const patterns = [
            /<div class="sign-box" id="party-b-signature">([\s\S]*?)<\/div>/,
            // Add fallback patterns for different templates
        ];

        let injected = false;
        for (const pattern of patterns) {
            if (pattern.test(html)) {
                const signatureHtml = `
          <div style="margin-top: 10px;">
            <img src="${signatureImage}" alt="Signature" style="max-height: 60px; display: block;" />
            <div style="margin-top: 5px; font-size: 14px;">
              <div><strong>${signerName}</strong></div>
              <div>${signerTitle}</div>
              <div>${signatureDate}</div>
            </div>
          </div>
        `;

                html = html.replace(pattern, (match) => {
                    return match.replace(/<\/div>$/, `${signatureHtml}</div>`);
                });

                injected = true;
                break;
            }
        }

        if (!injected) {
            console.warn('⚠️ Party B signature placeholder not found');
        }

        const pdfBuffer = await htmlToPdf(html);
        console.log('📄 Fully signed PDF generated, size:', pdfBuffer.length, 'bytes');

        // Store SIGNED PDF in S3 (this will create a new record)
        await storeNdaPdf({
            signRequestId: signer.signRequestId,
            kind: 'SIGNED',
            pdfBuffer: pdfBuffer,
        });
        console.log('✅ SIGNED PDF stored in S3');

        // Create audit event
        await prisma.auditEvent.create({
            data: {
                organizationId: signer.signRequest.organizationId,
                draftId: draft.id,
                eventType: 'SIGNED',
                metadata: {
                    signer_email: signer.email,
                    signer_name: signerName,
                    action: 'public_signature_submitted',
                },
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Signature submitted successfully',
        });
    } catch (error) {
        console.error('Sign public error:', error);
        return NextResponse.json(
            {
                error:
                    error instanceof Error ? error.message : 'Failed to submit signature',
            },
            { status: 500 }
        );
    }
}
