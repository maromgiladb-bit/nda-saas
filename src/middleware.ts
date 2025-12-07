import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define public routes (routes that don't require authentication)
const isPublicRoute = createRouteMatcher([
  '/coming-soon',         // Coming soon page
  '/api/access-check',    // Password check API
])

// Protect everything except public routes
export default clerkMiddleware(async (auth, req: NextRequest) => {
  // Check if user has access via cookie
  const hasAccess = req.cookies.get('site-access')?.value === 'granted'
  
  // Allow public routes
  if (isPublicRoute(req)) {
    return NextResponse.next()
  }
  
  // If no access cookie, redirect to coming soon
  if (!hasAccess) {
    return NextResponse.redirect(new URL('/coming-soon', req.url))
  }
  
  // Has access cookie, proceed with Clerk auth
  await auth.protect()
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}