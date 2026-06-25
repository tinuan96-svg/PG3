'use client'

import { usePathname } from 'next/navigation'

// The old 5-item bottom navigation has been replaced by the floating PocketButton.
// This component is kept so layout.tsx imports don't break, but renders nothing.
export default function PocketNavigation() {
  const pathname = usePathname()
  if (pathname?.startsWith('/admin')) return null
  return null
}
