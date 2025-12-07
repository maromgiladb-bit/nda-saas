'use client'

import { usePathname } from 'next/navigation'
import Footer from './Footer'

export default function FooterWrapper() {
    const pathname = usePathname()

    // Hide footer on coming-soon page
    if (pathname === '/coming-soon') {
        return null
    }

    return <Footer />
}
