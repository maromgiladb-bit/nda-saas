'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function switchOrganization(organizationId: string) {
    const cookieStore = await cookies()
    cookieStore.set('active-org-id', organizationId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        sameSite: 'lax'
    })

    // Refresh the page to reflect the new organization context
    // We can't use revalidatePath('/') effectively since we need to refresh the layout
    // redirecting to current location is tricky in server actions without passing pathname
    // For now, let's assume the client will handle the refresh/redirect or we redirect to dashboard
}
