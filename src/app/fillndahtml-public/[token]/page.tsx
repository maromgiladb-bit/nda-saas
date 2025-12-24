import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { renderNdaHtml } from '@/lib/renderNdaHtml';
import FillNDAPublicClient from './FillNDAPublicClient';

/**
 * Public page for Party B to fill/review NDA fields
 * Token is the Signer ID
 * Supports bidirectional editing loop
 */
export default async function FillNDAPublicPage({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const { token } = await params;

    // Find signer by ID with revisions
    const signer = await prisma.signer.findUnique({
        where: { id: token },
        include: {
            signRequest: {
                include: {
                    draft: {
                        include: {
                            revisions: {
                                orderBy: { createdAt: 'desc' },
                                take: 1
                            }
                        }
                    },
                    organization: true,
                },
            },
        },
    });

    if (!signer) {
        notFound();
    }

    const draft = signer.signRequest.draft;

    // Get workflow state with type assertion
    const extendedDraft = draft as typeof draft & {
        workflowState?: string;
        pendingInputFields?: string[];
    };
    const workflowState = extendedDraft.workflowState || 'AWAITING_INPUT';

    // Allow access for AWAITING_INPUT state (bidirectional loop)
    if (workflowState !== 'AWAITING_INPUT') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div className="text-6xl mb-4">ℹ️</div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {workflowState === 'SIGNING_COMPLETE' ? 'Already Completed' : 'Not Available'}
                    </h1>
                    <p className="text-gray-600">
                        {workflowState === 'SIGNING_COMPLETE'
                            ? 'This NDA has already been completed.'
                            : 'This NDA is not currently accepting input.'}
                    </p>
                </div>
            </div>
        );
    }

    const formData = (draft.content as Record<string, unknown>) || {};
    const templateId = (formData.templateId as string) || 'professional_mutual_nda_v1';
    const pendingInputFields = (extendedDraft.pendingInputFields as string[]) || [];

    // Get latest revision to see if Party A made changes
    const latestRevision = draft.revisions[0];
    const revisionContent = (latestRevision?.content as Record<string, unknown>) || {};
    const partyAChanges = (revisionContent.filledFields as Record<string, string>) || {};
    const hasPartyAChanges = Object.keys(partyAChanges).length > 0;

    // All editable Party B fields
    const allPartyBFields = [
        'party_b_name',
        'party_b_address',
        'party_b_phone',
        'party_b_signatory_name',
        'party_b_title',
        'party_b_email'
    ];

    // Generate HTML preview server-side
    const initialHtml = await renderNdaHtml(formData, templateId);

    return (
        <FillNDAPublicClient
            signerId={signer.id}
            signerEmail={signer.email}
            signerName={signer.name || ''}
            ndaTitle={draft.title || 'Untitled NDA'}
            formData={formData}
            templateId={templateId}
            pendingInputFields={pendingInputFields}
            allEditableFields={allPartyBFields}
            initialHtml={initialHtml}
            draftId={draft.id}
            hasPartyAChanges={hasPartyAChanges}
            partyAChanges={partyAChanges}
        />
    );
}
