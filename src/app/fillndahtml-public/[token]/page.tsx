import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { renderNdaHtml } from '@/lib/renderNdaHtml';
import FillNDAPublicClient from './FillNDAPublicClient';

/**
 * Public page for Party B to fill requested NDA fields
 * Token is the Signer ID
 */
export default async function FillNDAPublicPage({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const { token } = await params;

    // Find signer by ID
    const signer = await prisma.signer.findUnique({
        where: { id: token },
        include: {
            signRequest: {
                include: {
                    draft: true,
                    organization: true,
                },
            },
        },
    });

    if (!signer) {
        notFound();
    }

    const draft = signer.signRequest.draft;

    // Verify draft is in the right state
    if (draft.workflowState !== 'AWAITING_INPUT') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div className="text-6xl mb-4">ℹ️</div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {draft.workflowState === 'SIGNING_COMPLETE' ? 'Already Completed' : 'Not Available'}
                    </h1>
                    <p className="text-gray-600">
                        {draft.workflowState === 'SIGNING_COMPLETE'
                            ? 'This NDA has already been completed.'
                            : 'This NDA is not currently accepting input.'}
                    </p>
                </div>
            </div>
        );
    }

    const formData = (draft.content as Record<string, unknown>) || {};
    const templateId = (formData.templateId as string) || 'professional_mutual_nda_v1';
    const pendingInputFields = (draft.pendingInputFields as string[]) || [];

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
            initialHtml={initialHtml}
            draftId={draft.id}
        />
    );
}
