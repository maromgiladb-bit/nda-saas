'use client'

import { useAuth } from '@clerk/nextjs'
import { usePathname } from 'next/navigation'
import PrivateToolbar from './PrivateToolbar'
import PublicToolbar from './PublicToolbar'


interface OrganizationData {
  organizations: { id: string; name: string; slug: string }[]
  activeOrgId: string
}

export default function ToolbarSwitcher({ organizationData }: { organizationData?: OrganizationData | null }) {
  const { userId, isLoaded } = useAuth()
  const pathname = usePathname()

  // Don't render anything while loading or on coming-soon page
  if (!isLoaded || pathname === '/coming-soon') return null

  // Show appropriate toolbar based on authentication state
  return userId ? <PrivateToolbar organizationData={organizationData} /> : <PublicToolbar />
}
