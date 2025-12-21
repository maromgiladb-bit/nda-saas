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
        include: {
          signRequests: {
            include: {
              ndaPdfs: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      signers: {
        include: {
          signRequest: {
            include: {
              draft: true,
              ndaPdfs: true,
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
          createdDrafts: {
            include: {
              signRequests: {
                include: {
                  ndaPdfs: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' }
          },
          signers: {
            include: {
              signRequest: {
                include: {
                  draft: true,
                  ndaPdfs: true,
                }
              }
            },
            orderBy: { createdAt: 'desc' }
          }
        }
      });
    } else {
      // connecting issues or no email
      redirect('/');
    }
  }

  // Transform created/sent NDAs
  const createdNdas = user.createdDrafts.map((draft) => {
    // Find the latest sign request and its PDF
    const latestSignRequest = draft.signRequests?.[0];
    const sentPdf = latestSignRequest?.ndaPdfs?.find((pdf: { kind: string }) => pdf.kind === 'SENT');

    return {
      id: draft.id,
      partyName: draft.title || 'Untitled NDA',
      status: draft.status?.toLowerCase() || 'draft',
      createdAt: draft.createdAt || new Date(),
      signedAt: null,
      type: 'created' as const,
      pdfId: sentPdf?.id || null,
    };
  });

  // Transform received NDAs
  const receivedNdas = user.signers.map((signer) => {
    const draft = signer.signRequest.draft;

    return {
      id: draft.id,
      partyName: draft.title || 'Untitled NDA',
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
