import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

// GET - Retrieve company profile
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the user in our database
    const user = await prisma.users.findUnique({
      where: { external_id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get company profile for this user
    const profile = await prisma.company_profile.findFirst({
      where: {
        userid: user.id,
        isdefault: true
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
    
    // Find the user in our database
    const user = await prisma.users.findUnique({
      where: { external_id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if profile exists
    const existingProfile = await prisma.company_profile.findFirst({
      where: {
        userid: user.id,
        isdefault: true
      }
    });

    let profile;
    
    if (existingProfile) {
      // Update existing profile
      profile = await prisma.company_profile.update({
        where: { id: existingProfile.id },
        data: {
          companyname: data.companyname,
          email: data.email,
          phone: data.phone || null,
          website: data.website || null,
          addressline1: data.addressline1,
          addressline2: data.addressline2 || null,
          city: data.city,
          state: data.state || null,
          postalcode: data.postalcode || null,
          country: data.country,
          signatoryname: data.signatoryname,
          signatorytitle: data.signatorytitle || null,
          meta: data.meta || null,
          updatedat: new Date()
        }
      });
    } else {
      // Create new profile
      profile = await prisma.company_profile.create({
        data: {
          id: `${user.id}_default`,
          userid: user.id,
          companyname: data.companyname,
          email: data.email,
          phone: data.phone || null,
          website: data.website || null,
          addressline1: data.addressline1,
          addressline2: data.addressline2 || null,
          city: data.city,
          state: data.state || null,
          postalcode: data.postalcode || null,
          country: data.country,
          signatoryname: data.signatoryname,
          signatorytitle: data.signatorytitle || null,
          meta: data.meta || null,
          isdefault: true
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
