import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import DashboardClient from '@/components/dashboard/DashboardClient';

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/');
  }

  const user = await prisma.users.findUnique({
    where: { external_id: userId },
    include: {
      nda_drafts: {
        orderBy: { created_at: 'desc' },
      },
    },
  });

  if (!user) {
    redirect('/');
  }

  // Get received NDAs (where user is a signer but not the creator)
  const receivedNdasFromSigners = await prisma.signers.findMany({
    where: {
      user_id: user.id,
      nda_drafts: {
        created_by_id: {
          not: user.id,
        },
      },
    },
    include: {
      nda_drafts: true,
    },
    orderBy: {
      created_at: 'desc',
    },
  });

  // Transform created/sent NDAs
  const createdNdas = user.nda_drafts.map((draft) => {
    const draftData = draft.data as Record<string, unknown>;
    const partyBName = typeof draftData?.party_b_name === 'string' ? draftData.party_b_name : '';
    const partyAName = typeof draftData?.party_a_name === 'string' ? draftData.party_a_name : '';
    
    return {
      id: draft.id,
      partyName: partyBName || partyAName || 'Untitled NDA',
      status: draft.status?.toLowerCase() || 'draft',
      createdAt: draft.created_at || new Date(),
      signedAt: draft.provisional_recipient_signed_at,
      type: 'created' as const,
    };
  });

  // Transform received NDAs
  const receivedNdas = receivedNdasFromSigners.map((signer) => {
    const draft = signer.nda_drafts;
    const draftData = draft.data as Record<string, unknown>;
    const partyBName = typeof draftData?.party_b_name === 'string' ? draftData.party_b_name : '';
    const partyAName = typeof draftData?.party_a_name === 'string' ? draftData.party_a_name : '';
    
    return {
      id: draft.id,
      partyName: partyBName || partyAName || 'Untitled NDA',
      status: draft.status?.toLowerCase() || 'draft',
      createdAt: draft.created_at || new Date(),
      signedAt: signer.signed_at,
      type: 'received' as const,
    };
  });

  // Combine all NDAs
  const allNdas = [...createdNdas, ...receivedNdas].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  return <DashboardClient ndas={allNdas} />;
}
