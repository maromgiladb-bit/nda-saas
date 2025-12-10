'use client'

import { useState } from 'react'
import { switchOrganization } from '@/actions/organization'
import { useRouter } from 'next/navigation'

interface Organization {
    id: string
    name: string
    slug: string
}

interface OrgSwitcherProps {
    organizations: Organization[]
    activeOrgId: string
}

export default function OrgSwitcher({ organizations, activeOrgId }: OrgSwitcherProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)
    const router = useRouter()

    const activeOrg = organizations.find(org => org.id === activeOrgId) || organizations[0]

    async function handleSwitch(orgId: string) {
        setIsPending(true)
        setIsOpen(false)
        await switchOrganization(orgId)
        router.refresh()
        setIsPending(false)
    }

    return (
        <div className="relative ml-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={isPending}
                className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none"
            >
                <span className="hidden md:inline-block px-3 py-1 bg-gray-100 rounded-full border border-gray-200">
                    {activeOrg?.name || 'Select Org'} {isPending && '...'}
                </span>
                <svg className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-50">
                    {organizations.map((org) => (
                        <button
                            key={org.id}
                            onClick={() => handleSwitch(org.id)}
                            className={`block w-full text-left px-4 py-2 text-sm ${org.id === activeOrgId ? 'bg-gray-50 text-teal-600 font-bold' : 'text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            {org.name}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
