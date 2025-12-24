import { redirect, notFound } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import ReviewChangesClient from './ReviewChangesClient';
import { renderNdaHtml } from '@/lib/renderNdaHtml';

/**
 * Review Changes Page
 * Party A reviews changes submitted by Party B
 */
export default async function ReviewChangesPage({
    params,
}: {
    params: Promise<{ draftId: string }>;
}) {
    const { userId } = await auth();
    if (!userId) {
        redirect('/sign-in');
    }

    const { draftId } = await params;

    // Get user
    const user = await prisma.user.findUnique({
        where: { externalId: userId }
    });

    if (!user) {
        redirect('/');
    }

    // Get draft with revisions
    const draft = await prisma.ndaDraft.findUnique({
        where: {
            id: draftId,
            createdByUserId: user.id
        },
        include: {
            revisions: {
                orderBy: { createdAt: 'desc' },
                take: 1
            },
            signRequests: {
                include: {
                    signers: true
                },
                orderBy: { createdAt: 'desc' },
                take: 1
            }
        }
    });

    if (!draft) {
        notFound();
    }

    // Get latest revision
    const latestRevision = draft.revisions[0];
    const revisionContent = (latestRevision?.content as Record<string, unknown>) || {};
    const filledFields = (revisionContent.filledFields as Record<string, string>) || {};
    const suggestedChanges = (revisionContent.suggestedChanges as Record<string, string>) || {};
    const submittedBy = (revisionContent.submittedBy as string) || 'Unknown';

    const formData = (draft.content as Record<string, unknown>) || {};
    const templateId = (formData.templateId as string) || 'professional_mutual_nda_v1';

    // Generate HTML preview
    const previewHtml = await renderNdaHtml(formData, templateId);

    // Get workflow state - cast to extended type
    const extendedDraft = draft as typeof draft & {
        workflowState?: string;
        recipientEmail?: string;
    };

    return (
        <ReviewChangesClient
            draftId={draft.id}
            draftTitle={draft.title || 'Untitled NDA'}
            workflowState={extendedDraft.workflowState || 'REVIEWING_CHANGES'}
            formData={formData}
            filledFields={filledFields}
            suggestedChanges={suggestedChanges}
            submittedBy={submittedBy}
            previewHtml={previewHtml}
            templateId={templateId}
        />
    );
}
