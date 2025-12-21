import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import SignNDAPublicClient from './SignNDAPublicClient';
import { renderNdaHtml } from '@/lib/renderNdaHtml';

const DEV_TEST_TOKEN = '00000000-0000-0000-0000-000000000001';

export default async function SignNDAPublicPage({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const { token } = await params;
    const isDev = process.env.NODE_ENV === 'development';

    // Dev mode: Use mock data for testing
    if (isDev && token === DEV_TEST_TOKEN) {
        const mockFormData = {
            templateId: 'professional_mutual_nda_v1',
            // Party 1 (Sender - Party A)
            party_1_name: 'Acme Corporation',
            party_1_address: '123 Main St, San Francisco, CA 94102',
            party_1_signatory_name: 'John Smith',
            party_1_signatory_title: 'CEO',
            party_1_phone: '+1 (555) 123-4567',
            party_1_emails_joined: 'john@acme.com',
            // Party 2 (Receiver - Party B)
            party_2_name: 'Tech Solutions Inc.',
            party_2_address: '456 Market St, San Francisco, CA 94103',
            party_2_signatory_name: 'Jane Doe',
            party_2_signatory_title: 'CTO',
            party_2_phone: '+1 (555) 987-6543',
            party_2_emails_joined: 'jane@techsolutions.com',
            // Document fields
            effective_date: new Date().toISOString().split('T')[0],
            effective_date_long: new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            governing_law_full: 'California',
            purpose: 'evaluating a potential business relationship',
            information_scope_text: 'All information and materials',
            term_years_number: '2',
            term_years_words: 'two',
            additional_terms: 'No additional terms specified',
            doc_title: 'Mutual Non-Disclosure Agreement',
        };

        // Generate HTML server-side
        const initialHtml = await renderNdaHtml(mockFormData, 'professional_mutual_nda_v1');

        return (
            <SignNDAPublicClient
                signerId={DEV_TEST_TOKEN}
                signerEmail="jane@techsolutions.com"
                signerName="Jane Doe"
                ndaTitle="Sample NDA Agreement (Dev Mode)"
                formData={mockFormData}
                templateId="professional_mutual_nda_v1"
                initialHtml={initialHtml}
            />
        );
    }

    // Find signer by ID (using token as ID for now)
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

    // Check if already signed
    if (signer.status === 'SIGNED') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div className="text-6xl mb-4">✓</div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Already Signed
                    </h1>
                    <p className="text-gray-600">
                        This NDA has already been signed. Thank you!
                    </p>
                </div>
            </div>
        );
    }

    const draft = signer.signRequest.draft;
    const formData = (draft.content as Record<string, unknown>) || {};
    const templateId = (formData.templateId as string) || 'professional_mutual_nda_v1';

    // Generate HTML server-side
    const initialHtml = await renderNdaHtml(formData, templateId);

    return (
        <SignNDAPublicClient
            signerId={signer.id}
            signerEmail={signer.email}
            signerName={signer.name || ''}
            ndaTitle={draft.title || 'Untitled NDA'}
            formData={formData}
            templateId={templateId}
            initialHtml={initialHtml}
        />
    );
}
