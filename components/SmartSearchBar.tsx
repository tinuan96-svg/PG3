'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { smartSearch, logSearch, type SearchResult } from '@/lib/smart-search'

const PLACEHOLDER = 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400'

const QUICK_SEARCHES = [
  'Kerala breakfast', 'Fish curry', 'Onam shopping', 'Party snacks',
  'Instant dinner', 'Tea time snacks', 'Rice dishes', 'Biriyani',
]

interface Props {
  onClose?: () => void
  placeholder?: string
}

export default function SmartSearchBar({ onClose, placeholder = 'Try "Kerala breakfast ideas" or "things for fish curry"' }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [expandedQuery, setExpandedQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => { inputRef.current?.focus() }, [])

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setSearched(false); return }
    setLoading(true)
    const { results: r, expandedQuery: eq } = await smartSearch(q)
    setResults(r)
    setExpandedQuery(eq)
    setSearched(true)
    setLoading(false)
    logSearch(q, r.length)
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setQuery(v)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => runSearch(v), 350)
  }

  function handleQuick(q: string) {
    setQuery(q)
    runSearch(q)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    runSearch(query)
  }

  return (
    <div className="w-full">
      {/* Search input */}
      <form onSubmit={handleSubmit} className="relative mb-4">
        <div className="relative flex items-center">
          <svg className="absolute left-4 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={handleChange}
            placeholder={placeholder}
            className="w-full pl-12 pr-12 py-3.5 rounded-2xl border border-gray-200 focus:outline-none focus:border-[#5FAE9B] focus:ring-2 focus:ring-[#5FAE9B]/20 text-sm transition-all"
          />
          {query && (
            <button type="button" onClick={() => { setQuery(''); setResults([]); setSearched(false); inputRef.current?.focus() }}
              className="absolute right-4 text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </form>

      {/* Quick searches */}
      {!searched && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Try searching for</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_SEARCHES.map((q) => (
              <button key={q} onClick={() => handleQuick(q)}
                className="px-3 py-1.5 rounded-full text-xs font-medium border border-gray-200 text-gray-600 hover:border-[#5FAE9B] hover:text-[#5FAE9B] transition-colors">
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {loading && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-gray-100 animate-pulse h-40" />
            ))}
          </motion.div>
        )}

        {!loading && searched && results.length === 0 && (
          <motion.div key="empty" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="text-center py-10">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-bold text-gray-700 mb-1">No products found</p>
            <p className="text-sm text-gray-400">Try a different search — e.g. &quot;rice&quot;, &quot;spices&quot;, or &quot;snacks&quot;</p>
          </motion.div>
        )}

        {!loading && results.length > 0 && (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {expandedQuery !== query.toLowerCase().trim() && (
              <p className="text-xs text-gray-400 mb-3">
                Showing results for <span className="font-semibold text-gray-600">&quot;{expandedQuery}&quot;</span>
              </p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {results.map((r) => (
                <Link key={r.product_id} href={`/products/${r.slug}`} onClick={onClose}
                  className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                  <div className="relative h-32 bg-gray-50">
                    <Image src={r.image || PLACEHOLDER} alt={r.name} fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      unoptimized sizes="(max-width: 640px) 50vw, 25vw"
                      onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER }} />
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-snug mb-1 min-h-[2.5rem]">{r.name}</p>
                    {r.brand_name && <p className="text-[10px] text-gray-400 mb-1">{r.brand_name}</p>}
                    <p className="text-sm font-extrabold" style={{ color: '#0F2747' }}>£{Number(r.price).toFixed(2)}</p>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-4 text-center">
              <Link href={`/products?q=${encodeURIComponent(query)}`} onClick={onClose}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90"
                style={{ backgroundColor: '#5FAE9B' }}>
                View all {results.length}+ results
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
