import { createClient } from '@supabase/supabase-js'

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export interface SearchResult {
  product_id: string
  name: string
  slug: string
  image: string | null
  price: number
  compare_price: number | null
  brand_name: string
  relevance: number
}

// Maps natural language intents to keyword expansions
const INTENT_MAP: Record<string, string> = {
  'kerala breakfast':   'puttu appam idli dosa porridge uppuma',
  'fish curry':         'fish curry coconut masala tamarind kodampuli',
  'onam shopping':      'onam sadya payasam rice papadam pickle avial',
  'party snacks':       'chips murukku mixture biscuits namkeen nuts',
  'vegetarian meals':   'rice dal lentil sambar rasam curry vegetable',
  'instant dinner':     'instant noodles ready meal pasta quick cook',
  'tea time':           'tea coffee biscuits cake snacks murukku',
  'rice dishes':        'matta rice red rice basmati biriyani',
  'sweets desserts':    'halwa ladoo barfi payasam sweet jaggery',
  'spices masala':      'chilli turmeric coriander cumin pepper garam masala',
  'biriyani':           'biriyani rice ghee spices meat masala',
  'healthy':            'organic natural whole grain sugar free low fat',
}

function expandQuery(query: string): string {
  const q = query.toLowerCase().trim()
  for (const [intent, expansion] of Object.entries(INTENT_MAP)) {
    if (q.includes(intent) || intent.includes(q)) {
      return expansion
    }
  }
  return q
}

export async function smartSearch(
  query: string,
  limit = 20,
  offset = 0
): Promise<{ results: SearchResult[]; expandedQuery: string }> {
  const expandedQuery = expandQuery(query)
  try {
    const { data, error } = await getClient().rpc('smart_search_products', {
      p_query: expandedQuery,
      p_limit: limit,
      p_offset: offset,
    })
    if (error) { console.error('smartSearch:', error.message); return { results: [], expandedQuery } }
    const results = (data ?? []).map((r: Record<string, unknown>) => ({
      product_id: String(r.product_id ?? ''),
      name: String(r.name ?? ''),
      slug: String(r.slug ?? ''),
      image: r.image ? String(r.image) : null,
      price: Number(r.price ?? 0),
      compare_price: r.compare_price != null ? Number(r.compare_price) : null,
      brand_name: String(r.brand_name ?? ''),
      relevance: Number(r.relevance ?? 0),
    }))
    return { results, expandedQuery }
  } catch (e) {
    console.error('smartSearch:', e)
    return { results: [], expandedQuery }
  }
}

export async function logSearch(query: string, resultCount: number, sessionId?: string) {
  try {
    await getClient().from('smart_search_logs').insert({
      query: query.toLowerCase().trim(),
      result_count: resultCount,
      session_id: sessionId ?? null,
    })
  } catch {
    // Non-critical — swallow
  }
}
