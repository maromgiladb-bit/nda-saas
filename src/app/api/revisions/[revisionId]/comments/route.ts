import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

interface RequestBody {
  path: string
  text: string
  author: 'OWNER' | 'RECIPIENT'
}

export async function POST(
  request: NextRequest,
  { params }: { params: { revisionId: string } }
): Promise<NextResponse> {
  try {
    const { userId } = await auth()
    const revisionId = params.revisionId

    // Parse request body
    const body = await request.json() as RequestBody
    const { path, text, author } = body

    if (!path || !text || !author) {
      return NextResponse.json(
        { error: 'path, text, and author are required' },
        { status: 400 }
      )
    }

    // Get revision
    const revision = await prisma.nda_revisions.findUnique({
      where: { id: revisionId },
      include: {
        draft: {
          include: {
            users: true
          }
        }
      }
    })

    if (!revision) {
      return NextResponse.json({ error: 'Revision not found' }, { status: 404 })
    }

    // Verify authorization (TODO: add proper token-based auth for recipient)
    if (author === 'OWNER' && userId && revision.draft.users.external_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get current comments
    const currentComments = (revision.comments as Record<string, Array<{ author: string; text: string; ts: string }>>) || {}
    const pathComments = currentComments[path] || []

    // Add new comment
    const newComment = {
      author,
      text,
      ts: new Date().toISOString()
    }
    pathComments.push(newComment)
    currentComments[path] = pathComments

    // Update revision
    await prisma.nda_revisions.update({
      where: { id: revisionId },
      data: {
        comments: currentComments
      }
    })

    return NextResponse.json({
      ok: true,
      comments: pathComments
    })

  } catch (error) {
    console.error('Error adding comment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { revisionId: string } }
): Promise<NextResponse> {
  try {
    const revisionId = params.revisionId
    const url = new URL(request.url)
    const path = url.searchParams.get('path')

    // Get revision
    const revision = await prisma.nda_revisions.findUnique({
      where: { id: revisionId },
      select: { comments: true }
    })

    if (!revision) {
      return NextResponse.json({ error: 'Revision not found' }, { status: 404 })
    }

    const allComments = (revision.comments as Record<string, Array<{ author: string; text: string; ts: string }>>) || {}

    if (path) {
      return NextResponse.json({
        comments: allComments[path] || []
      })
    }

    return NextResponse.json({
      comments: allComments
    })

  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
