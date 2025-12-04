import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// GET - Retrieve company profile
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the user and their organization
    const user = await prisma.user.findUnique({
      where: { externalId: userId },
      include: { memberships: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Assuming single organization for now or taking the first one
    const membership = user.memberships[0];
    if (!membership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    // Get company profile for this organization
    const profile = await prisma.companyProfile.findUnique({
      where: {
        organizationId: membership.organizationId
      }
    });

    if (!profile) {
      return NextResponse.json({ profile: null }, { status: 200 });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Error fetching company profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch company profile' },
      { status: 500 }
    );
  }
}

// POST - Create or update company profile
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    // Find the user and their organization
    const user = await prisma.user.findUnique({
      where: { externalId: userId },
      include: { memberships: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const membership = user.memberships[0];
    if (!membership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    // Check if profile exists
    const existingProfile = await prisma.companyProfile.findUnique({
      where: {
        organizationId: membership.organizationId
      }
    });

    let profile;

    if (existingProfile) {
      // Update existing profile
      profile = await prisma.companyProfile.update({
        where: { id: existingProfile.id },
        data: {
          companyName: data.companyname,
          email: data.email,
          phone: data.phone || null,
          website: data.website || null,
          address: data.addressline1,
          addressLine2: data.addressline2 || null,
          city: data.city,
          state: data.state || null,
          zipCode: data.postalcode || null,
          country: data.country,
          signatoryName: data.signatoryname,
          signatoryTitle: data.signatorytitle || null,
          // meta: data.meta || null, // Removed as not in schema
        }
      });
    } else {
      // Create new profile
      profile = await prisma.companyProfile.create({
        data: {
          organizationId: membership.organizationId,
          companyName: data.companyname,
          email: data.email,
          phone: data.phone || null,
          website: data.website || null,
          address: data.addressline1,
          addressLine2: data.addressline2 || null,
          city: data.city,
          state: data.state || null,
          zipCode: data.postalcode || null,
          country: data.country,
          signatoryName: data.signatoryname,
          signatoryTitle: data.signatorytitle || null,
        }
      });
    }

    return NextResponse.json({
      success: true,
      profile,
      message: 'Company profile saved successfully'
    });
  } catch (error) {
    console.error('Error saving company profile:', error);
    return NextResponse.json(
      { error: 'Failed to save company profile' },
      { status: 500 }
    );
  }
}
