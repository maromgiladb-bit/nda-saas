import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { draftId, signerEmail, signerName, signerTitle, signatureImage, signatureDate } = body;

        // Validate required fields
        if (!draftId || !signatureImage || !signerName) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Find the draft
        const draft = await prisma.ndaDraft.findUnique({
            where: { id: draftId }
        });

        if (!draft) {
            return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
        }

        // Update draft with signature data
        const currentContent = draft.content as Record<string, any>;
        const updatedContent = {
            ...currentContent,
            signatures: {
                ...(currentContent.signatures || {}),
                partyA: {
                    name: signerName,
                    title: signerTitle,
                    date: signatureDate,
                    imageData: signatureImage,
                    signedAt: new Date().toISOString(),
                    signerEmail,
                }
            }
        };

        // Update draft status and content
        const updatedDraft = await prisma.ndaDraft.update({
            where: { id: draftId },
            data: {
                content: updatedContent,
                status: 'PENDING_COUNTERSIGN', // Waiting for Party B to sign
            }
        });

        return NextResponse.json({
            success: true,
            signedDraftId: updatedDraft.id,
            message: 'Signature submitted successfully'
        });

    } catch (error) {
        console.error('Signature submission error:', error);
        return NextResponse.json(
            { error: 'Failed to submit signature' },
            { status: 500 }
        );
    }
}
