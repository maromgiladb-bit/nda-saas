'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { MembershipRole } from '@prisma/client'
import { addMemberToOrganization } from '@/organizations/limits'

export async function inviteMember(formData: FormData) {
    const { userId } = await auth()
    if (!userId) {
        return { error: 'Unauthorized' }
    }

    const email = formData.get('email') as string
    const role = formData.get('role') as MembershipRole

    if (!email || !role) {
        return { error: 'Email and role are required' }
    }

    try {
        // 1. Get current user and their organization (Owner/Admin check)
        const currentUser = await prisma.user.findUnique({
            where: { externalId: userId },
            include: {
                memberships: {
                    include: { organization: true }
                }
            }
        })

        if (!currentUser || currentUser.memberships.length === 0) {
            return { error: 'You do not belong to an organization' }
        }

        // Assuming context is the first organization for now
        const membership = currentUser.memberships[0]
        const organizationId = membership.organizationId

        if (membership.role !== 'OWNER' && membership.role !== 'ADMIN') {
            return { error: 'You do not have permission to invite members' }
        }

        // 2. Check if user exists
        let user = await prisma.user.findUnique({
            where: { email }
        })

        // 3. If user doesn't exist, create a placeholder user
        if (!user) {
            user = await prisma.user.create({
                data: {
                    email,
                    externalId: `invited_${email}_${Date.now()}`, // Placeholder ID
                    name: email.split('@')[0], // Default name
                }
            })
        }

        // 4. Check if already a member
        const existingMembership = await prisma.membership.findUnique({
            where: {
                userId_organizationId: {
                    userId: user.id,
                    organizationId
                }
            }
        })

        if (existingMembership) {
            return { error: 'User is already a member of this organization' }
        }

        // 5. Create Membership
        try {
            await addMemberToOrganization(organizationId, user.id, role)
        } catch (err: any) {
            if (err.message && err.message.includes('maximum number of users')) {
                return { error: err.message }
            }
            throw err
        }

        revalidatePath('/team')
        return { success: true }
    } catch (error: any) {
        console.error('Invite error:', error)
        return { error: error.message || 'Failed to invite member' }
    }
}

export async function removeMember(memberId: string) {
    const { userId } = await auth()
    if (!userId) return { error: 'Unauthorized' }

    try {
        // Validation logic similar to invite...
        // For brevity, assuming implemented or TBD
        // ...

        // This is a placeholder for the actual removal logic
        return { error: 'Remove not implemented yet' }
    } catch (error) {
        return { error: 'Failed to remove member' }
    }
}

export async function updateMemberRole(formData: FormData) {
    // TBD
    return { error: 'Update not implemented yet' }
}
