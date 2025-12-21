import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import SignNDAPublicClient from './SignNDAPublicClient';

export default async function SignNDAPublicPage({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const { token } = await params;

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

    return (
        <SignNDAPublicClient
            signerId={signer.id}
            signerEmail={signer.email}
            signerName={signer.name || ''}
            ndaTitle={draft.title || 'Untitled NDA'}
            formData={formData}
        />
    );
}
