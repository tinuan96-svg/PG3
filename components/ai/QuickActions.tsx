'use client'

import { QUICK_ACTIONS } from '@/lib/ai-assistant'

interface Props {
  onSelect: (text: string) => void
}

const icons: Record<string, JSX.Element> = {
  fish: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>,
  cart: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4" /></svg>,
  snack: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4" /></svg>,
  delivery: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2-1.5L7 16l2-1.5L11 16l2-1.5z" /></svg>,
  rice: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>,
  coin: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8v1m0 7v1" /></svg>,
}

export default function QuickActions({ onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-1.5 px-4 pb-2">
      {QUICK_ACTIONS.map((action) => (
        <button
          key={action.label}
          onClick={() => onSelect(action.label)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium border border-gray-200 bg-white hover:bg-gray-50 transition-colors active:scale-95"
          style={{ color: '#0F2747' }}
        >
          <span style={{ color: '#5FAE9B' }}>{icons[action.icon]}</span>
          {action.label}
        </button>
      ))}
    </div>
  )
}
