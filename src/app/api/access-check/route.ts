import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    
    // Check against environment variable password
    const correctPassword = process.env.ACCESS_PASSWORD || 'demo123';
    
    if (password === correctPassword) {
      // Set a cookie to remember access
      const response = NextResponse.json({ success: true });
      response.cookies.set('site-access', 'granted', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
      return response;
    } else {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
