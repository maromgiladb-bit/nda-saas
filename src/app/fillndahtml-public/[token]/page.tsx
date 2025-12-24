import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { renderNdaHtml } from '@/lib/renderNdaHtml';
import FillNDAPublicClient from './FillNDAPublicClient';

type FieldState = "readonly" | "editable" | "pending_suggestion";

interface FieldStates {
    [key: string]: FieldState;
}

interface Suggestion {
    oldValue: string;
    newValue: string;
    suggestedBy: "party_a" | "party_b";
}

interface Suggestions {
    [key: string]: Suggestion;
}

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
                                take: 5 // Get recent revisions to find suggestions
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

    // Allow access for AWAITING_INPUT state
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

    // Compute field states
    const fieldStates: FieldStates = {};
    const allFields = [
        "party_a_name", "party_a_address", "party_a_phone",
        "party_a_signatory_name", "party_a_title", "party_a_email",
        "party_b_name", "party_b_address", "party_b_phone",
        "party_b_signatory_name", "party_b_title", "party_b_email",
    ];

    for (const field of allFields) {
        if (pendingInputFields.includes(field)) {
            fieldStates[field] = "editable";
        } else {
            fieldStates[field] = "readonly";
        }
    }

    // Get incoming suggestions from latest revision
    const incomingSuggestions: Suggestions = {};
    const latestRevision = draft.revisions[0];
    if (latestRevision) {
        const revContent = latestRevision.content as Record<string, unknown>;
        const revSuggestions = revContent.suggestedChanges as Record<string, string> | undefined;

        // Check who made this revision
        const submittedBy = revContent.submittedBy as string | undefined;
        const isFromPartyA = submittedBy !== signer.email;

        if (revSuggestions && isFromPartyA) {
            for (const [field, newValue] of Object.entries(revSuggestions)) {
                if (newValue?.trim()) {
                    incomingSuggestions[field] = {
                        oldValue: (formData[field] as string) || "",
                        newValue,
                        suggestedBy: "party_a"
                    };
                    fieldStates[field] = "pending_suggestion";
                }
            }
        }
    }

    // Generate HTML preview server-side
    const initialHtml = await renderNdaHtml(formData, templateId);

    return (
        <FillNDAPublicClient
            signerId={signer.id}
            signerEmail={signer.email}
            signerName={signer.name || ''}
            ndaTitle={draft.title || 'Untitled NDA'}
            formData={formData as Record<string, string | boolean>}
            templateId={templateId}
            pendingInputFields={pendingInputFields}
            fieldStates={fieldStates}
            incomingSuggestions={incomingSuggestions}
            initialHtml={initialHtml}
            draftId={draft.id}
        />
    );
}
