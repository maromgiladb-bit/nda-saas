import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import InviteMemberForm from '@/app/team/InviteMemberForm' // Re-using component for now. Should ideally move it too.
import { getActiveOrganization } from '@/lib/db-organization'

export default async function TeamSettingsPage() {
    const { userId } = await auth()
    if (!userId) redirect('/sign-in')

    const membership = await getActiveOrganization()

    if (!membership) {
        return (
            <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6 text-center">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">No active organization found</h3>
                    <div className="mt-2 max-w-xl text-sm text-gray-500">
                        <p>Please switch to an organization or contact support.</p>
                    </div>
                </div>
            </div>
        )
    }

    const organizationData = await prisma.organization.findUnique({
        where: { id: membership.organizationId },
        include: {
            memberships: {
                include: { user: true }
            }
        }
    })

    if (!organizationData) return null

    const organization = organizationData
    const role = membership.role
    const members = organization.memberships
    const canInvite = role === 'OWNER' || role === 'ADMIN'

    return (
        <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Team Management</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Manage members for <strong>{organization.name}</strong>
                </p>
            </div>

            <ul role="list" className="divide-y divide-gray-200">
                {members.map((member) => (
                    <li key={member.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold border border-slate-300">
                                        {member.user.name?.[0]?.toUpperCase() || member.user.email[0]?.toUpperCase() || '?'}
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-[var(--teal-600)] truncate">
                                        {member.user.name || 'Unnamed User'}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">{member.user.email}</p>
                                    {member.user.externalId.startsWith('invited_') && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 mt-1">
                                            Pending Invite
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex-shrink-0 flex flex-col items-end">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                ${member.role === 'OWNER' ? 'bg-purple-100 text-purple-800' :
                                        member.role === 'ADMIN' ? 'bg-blue-100 text-blue-800' :
                                            'bg-green-100 text-green-800'}`}>
                                    {member.role}
                                </span>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>

            {canInvite && (
                <div className="px-4 py-5 sm:px-6 border-t border-gray-200 bg-gray-50">
                    <InviteMemberForm />
                </div>
            )}
        </div>
    )
}
