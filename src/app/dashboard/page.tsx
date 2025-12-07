import { redirect } from 'next/navigation';
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import DashboardClient from '@/components/dashboard/DashboardClient';

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/');
  }

  let user = await prisma.user.findUnique({
    where: { externalId: userId },
    include: {
      createdDrafts: {
        orderBy: { createdAt: 'desc' },
      },
      signers: {
        include: {
          signRequest: {
            include: {
              draft: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }
    },
  });

  if (!user) {
    // If auth exists but checking DB failed to find user, try to sync/create
    const { email } = await currentUser().then(u => ({ email: u?.emailAddresses[0]?.emailAddress }));

    if (email) {
      user = await prisma.user.create({
        data: {
          externalId: userId,
          email: email
        },
        include: {
          createdDrafts: { orderBy: { createdAt: 'desc' } },
          signers: { include: { signRequest: { include: { draft: true } } }, orderBy: { createdAt: 'desc' } }
        }
      });
    } else {
      // connecting issues or no email
      redirect('/');
    }
  }

  // Transform created/sent NDAs
  const createdNdas = user.createdDrafts.map((draft) => {
    const draftData = draft.content as Record<string, unknown>;
    const partyBName = typeof draftData?.party_b_name === 'string' ? draftData.party_b_name : '';
    const partyAName = typeof draftData?.party_a_name === 'string' ? draftData.party_a_name : '';

    return {
      id: draft.id,
      partyName: partyBName || partyAName || 'Untitled NDA',
      status: draft.status?.toLowerCase() || 'draft',
      createdAt: draft.createdAt || new Date(),
      signedAt: null, // Logic for signedAt needs to come from SignRequest if linked, but for draft list it's simple
      type: 'created' as const,
    };
  });

  // Transform received NDAs
  const receivedNdas = user.signers.map((signer) => {
    const draft = signer.signRequest.draft;
    const draftData = draft.content as Record<string, unknown>;
    const partyBName = typeof draftData?.party_b_name === 'string' ? draftData.party_b_name : '';
    const partyAName = typeof draftData?.party_a_name === 'string' ? draftData.party_a_name : '';

    return {
      id: draft.id,
      partyName: partyBName || partyAName || 'Untitled NDA',
      status: signer.status?.toLowerCase() || 'pending',
      createdAt: draft.createdAt || new Date(),
      signedAt: signer.updatedAt, // Approximation
      type: 'received' as const,
    };
  });

  // Combine all NDAs
  const allNdas = [...createdNdas, ...receivedNdas].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  return <DashboardClient ndas={allNdas} />;
}
