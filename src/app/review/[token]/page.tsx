import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { listChanges, formatFieldPath } from '@/lib/diff'
import ReviewPageClient from './ReviewPageClient'

interface PageProps {
  params: { token: string }
}

export default async function ReviewPage({ params }: PageProps) {
  const { token } = params
  const isDev = process.env.NODE_ENV === 'development'

  // Validate token
  let signRequest = await prisma.sign_requests.findUnique({
    where: { token },
    include: {
      signers: {
        include: {
          nda_drafts: {
            include: {
              users: true,
              revisions: {
                orderBy: { number: 'desc' },
                take: 1
              }
            }
          }
        }
      }
    }
  })

  // Development mode: use mock data if token not found
  if (!signRequest && isDev) {
    console.log('🔧 Development mode: Using mock data for review page')
    signRequest = {
      token: token || 'dev-token',
      consumed_at: null,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      scope: 'REVIEW',
      signers: {
        nda_drafts: {
          id: 'dev-draft-id',
          title: '[DEV] Sample NDA Review',
          status: 'PENDING_OWNER_REVIEW',
          data: {
            partyACompany: 'Acme Corp',
            partyBCompany: 'Widget Inc',
            effectiveDate: new Date().toISOString().split('T')[0],
          },
          provisional_recipient_signed_at: null,
          revisions: [
            {
              id: 'dev-revision-id',
              number: 1,
              message: 'Updated company names and effective date',
              actor_role: 'RECIPIENT',
              diff: {
                'partyBCompany': { before: 'Old Company', after: 'Widget Inc' },
                'effectiveDate': { before: '2024-01-01', after: new Date().toISOString().split('T')[0] }
              },
              comments: {}
            }
          ],
          users: { name: 'Dev User', email: 'dev@example.com' }
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any
  }

  if (!signRequest) {
    notFound()
  }

  if (signRequest.consumed_at) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="text-6xl mb-4">✓</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Already Reviewed</h1>
          <p className="text-gray-600">This review has already been completed.</p>
        </div>
      </div>
    )
  }

  if (new Date() > signRequest.expires_at) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="text-6xl mb-4">⏰</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Link Expired</h1>
          <p className="text-gray-600">This review link has expired. Please contact the sender for a new link.</p>
        </div>
      </div>
    )
  }

  if (signRequest.scope !== 'REVIEW') {
    notFound()
  }

  const draft = signRequest.signers.nda_drafts

  if (!draft || draft.status !== 'PENDING_OWNER_REVIEW') {
    notFound()
  }

  // Get the latest revision
  const latestRevision = draft.revisions[0]

  if (!latestRevision) {
    notFound()
  }

  // Compute changes
  const changes = listChanges(latestRevision.diff as Record<string, unknown>)
  const formattedChanges = changes.map(c => ({
    path: c.path,
    field: formatFieldPath(c.path),
    before: c.before,
    after: c.after,
    type: c.type
  }))

  // Get comments
  const comments = (latestRevision.comments as Record<string, Array<{ author: string; text: string; ts: string }>>) || {}

  return (
    <ReviewPageClient
      token={token}
      draft={{
        id: draft.id,
        title: draft.title || 'Untitled NDA',
        data: draft.data as Record<string, unknown>
      }}
      revision={{
        id: latestRevision.id,
        number: latestRevision.number,
        message: latestRevision.message,
        actor_role: latestRevision.actor_role
      }}
      changes={formattedChanges}
      comments={comments}
      provisionallySignedByRecipient={!!draft.provisional_recipient_signed_at}
    />
  )
}
