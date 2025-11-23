import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { ndaId, signatureData } = body;

    if (!ndaId || !signatureData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const user = await prisma.users.findUnique({
      where: { external_id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify the NDA belongs to this user before updating
    const existingDraft = await prisma.nda_drafts.findUnique({
      where: { id: ndaId },
    });

    if (!existingDraft || existingDraft.created_by_id !== user.id) {
      return NextResponse.json({ error: 'NDA not found or unauthorized' }, { status: 404 });
    }

    const nda = await prisma.nda_drafts.update({
      where: {
        id: ndaId,
      },
      data: {
        status: 'SIGNED',
        provisional_recipient_signed_at: new Date(),
        updated_at: new Date(),
      },
    });

    return NextResponse.json({ success: true, nda });
  } catch (error) {
    console.error('Error saving signed NDA:', error);
    return NextResponse.json(
      { error: 'Failed to save signed NDA' },
      { status: 500 }
    );
  }
}