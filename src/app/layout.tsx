import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Geist, Geist_Mono } from 'next/font/google'
import ToolbarSwitcher from '@/components/ToolbarSwitcher'
import FooterWrapper from '@/components/FooterWrapper'
import './globals.css'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getActiveOrganization } from '@/lib/db-organization'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Formalize It - NDA Management Platform',
  description: 'Create and manage NDAs with ease',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { userId } = await auth()
  let organizationData = null

  if (userId) {
    const user = await prisma.user.findUnique({
      where: { externalId: userId },
      include: {
        memberships: {
          include: { organization: true }
        }
      }
    })

    if (user && user.memberships.length > 0) {
      const activeMembership = await getActiveOrganization()
      organizationData = {
        organizations: user.memberships.map((m: any) => ({
          // Temporary any cast or just rely on inference if imports are clean, 
          // but 'any' is safest for quick fix without importing Prisma types fully
          id: m.organization.id,
          name: m.organization.name,
          slug: m.organization.slug
        })),
        activeOrgId: activeMembership?.organizationId || user.memberships[0].organizationId
      }
    }
  }

  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}>
          <ToolbarSwitcher organizationData={organizationData} />
          <div className="flex-1">
            {children}
          </div>
          <FooterWrapper />
        </body>
      </html>
    </ClerkProvider>
  )
}
