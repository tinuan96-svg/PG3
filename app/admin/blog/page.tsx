'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { supabase } from '@/lib/supabase'

type BlogCategory = { id: string; name: string; slug: string }

type BlogPost = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  featured_image: string | null
  status: 'draft' | 'published'
  category_id: string | null
  published_at: string | null
  created_at: string
  seo_title: string | null
  seo_description: string | null
  seo_keywords: string | null
  blog_category?: { name: string } | null
}

type PostForm = {
  title: string
  slug: string
  excerpt: string
  content: string
  featured_image: string
  status: 'draft' | 'published'
  category_id: string
  seo_title: string
  seo_description: string
  seo_keywords: string
}

const EMPTY_FORM: PostForm = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  featured_image: '',
  status: 'draft',
  category_id: '',
  seo_title: '',
  seo_description: '',
  seo_keywords: '',
}

function toSlug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [view, setView] = useState<'list' | 'editor'>('list')
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<PostForm>(EMPTY_FORM)
  const [tab, setTab] = useState<'all' | 'draft' | 'published'>('all')
  const [editorTab, setEditorTab] = useState<'content' | 'seo'>('content')
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    const [{ data: postsData }, { data: catsData }] = await Promise.all([
      db.from('blog_posts').select('*, blog_category:blog_categories(name)').order('created_at', { ascending: false }),
      db.from('blog_categories').select('id, name, slug').order('name'),
    ])
    setPosts(postsData ?? [])
    setCategories(catsData ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setForm(EMPTY_FORM)
    setEditId(null)
    setError('')
    setEditorTab('content')
    setView('editor')
  }

  async function openEdit(p: BlogPost) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any).from('blog_posts').select('*').eq('id', p.id).maybeSingle()
    if (!data) return
    setForm({
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt ?? '',
      content: data.content ?? '',
      featured_image: data.featured_image ?? '',
      status: data.status,
      category_id: data.category_id ?? '',
      seo_title: data.seo_title ?? '',
      seo_description: data.seo_description ?? '',
      seo_keywords: data.seo_keywords ?? '',
    })
    setEditId(p.id)
    setError('')
    setEditorTab('content')
    setView('editor')
  }

  function handleTitleChange(v: string) {
    setForm((f) => ({ ...f, title: v, slug: f.slug || toSlug(v) }))
  }

  async function handleSave(publishNow = false) {
    if (!form.title.trim()) { setError('Title is required'); return }
    setSaving(true)
    setError('')
    const status = publishNow ? 'published' : form.status
    const payload = {
      title: form.title.trim(),
      slug: form.slug || toSlug(form.title),
      excerpt: form.excerpt || null,
      content: form.content || null,
      featured_image: form.featured_image || null,
      status,
      category_id: form.category_id || null,
      seo_title: form.seo_title || null,
      seo_description: form.seo_description || null,
      seo_keywords: form.seo_keywords || null,
      published_at: status === 'published' ? new Date().toISOString() : null,
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    let err
    if (!editId) {
      ;({ error: err } = await db.from('blog_posts').insert(payload))
    } else {
      ;({ error: err } = await db.from('blog_posts').update(payload).eq('id', editId))
    }
    setSaving(false)
    if (err) { setError(err.message); return }
    setView('list')
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this post?')) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('blog_posts').delete().eq('id', id)
    setPosts((prev) => prev.filter((p) => p.id !== id))
  }

  const filtered = posts.filter((p) => tab === 'all' || p.status === tab)
  const draftCount = posts.filter((p) => p.status === 'draft').length
  const publishedCount = posts.filter((p) => p.status === 'published').length

  if (view === 'editor') {
    return (
      <AdminLayout>
        <div className="max-w-3xl mx-auto space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{editId ? 'Edit Post' : 'New Post'}</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Status: <span className={`font-medium ${form.status === 'published' ? 'text-green-600' : 'text-amber-600'}`}>{form.status}</span>
              </p>
            </div>
            <button onClick={() => setView('list')} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Back to posts
            </button>
          </div>

          {error && <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>}

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex gap-1 px-6 pt-4 border-b border-gray-100">
              {(['content', 'seo'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setEditorTab(t)}
                  className={`text-sm font-medium px-4 py-2 capitalize border-b-2 transition-colors ${editorTab === t ? 'border-[#0F2747] text-[#0F2747]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                >
                  {t === 'content' ? 'Content' : 'SEO'}
                </button>
              ))}
            </div>

            <div className="p-6 space-y-4">
              {editorTab === 'content' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Title *</label>
                    <input
                      value={form.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5FAE9B]/30 focus:border-[#5FAE9B]"
                      placeholder="Post title"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Slug</label>
                      <input
                        value={form.slug}
                        onChange={(e) => setForm((f) => ({ ...f, slug: toSlug(e.target.value) }))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#5FAE9B]/30 focus:border-[#5FAE9B]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Category</label>
                      <select
                        value={form.category_id}
                        onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5FAE9B]/30 focus:border-[#5FAE9B] bg-white"
                      >
                        <option value="">No category</option>
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Excerpt</label>
                    <textarea
                      rows={2}
                      value={form.excerpt}
                      onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5FAE9B]/30 focus:border-[#5FAE9B] resize-none"
                      placeholder="Brief summary shown in listings"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Content</label>
                    <textarea
                      rows={12}
                      value={form.content}
                      onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5FAE9B]/30 focus:border-[#5FAE9B] resize-y font-mono"
                      placeholder="Write your post content here…"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Featured Image URL</label>
                    <div className="flex items-center gap-2">
                      <input
                        value={form.featured_image}
                        onChange={(e) => setForm((f) => ({ ...f, featured_image: e.target.value }))}
                        className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#5FAE9B]/30 focus:border-[#5FAE9B]"
                        placeholder="https://..."
                      />
                      {form.featured_image && (
                        <img src={form.featured_image} alt="" className="w-12 h-12 rounded-xl border border-gray-100 object-cover bg-gray-50" />
                      )}
                    </div>
                  </div>
                </>
              )}

              {editorTab === 'seo' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">SEO Title</label>
                    <input
                      value={form.seo_title}
                      onChange={(e) => setForm((f) => ({ ...f, seo_title: e.target.value }))}
                      maxLength={70}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5FAE9B]/30 focus:border-[#5FAE9B]"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">{form.seo_title.length}/70</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Meta Description</label>
                    <textarea
                      rows={3}
                      value={form.seo_description}
                      onChange={(e) => setForm((f) => ({ ...f, seo_description: e.target.value }))}
                      maxLength={160}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5FAE9B]/30 focus:border-[#5FAE9B] resize-none"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">{form.seo_description.length}/160</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Keywords</label>
                    <input
                      value={form.seo_keywords}
                      onChange={(e) => setForm((f) => ({ ...f, seo_keywords: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5FAE9B]/30 focus:border-[#5FAE9B]"
                      placeholder="comma separated"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as 'draft' | 'published' }))}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#5FAE9B]"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setView('list')} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-xl transition-colors">Cancel</button>
              <button
                onClick={() => handleSave(false)}
                disabled={saving}
                className="px-5 py-2 text-sm font-semibold border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              {form.status !== 'published' && (
                <button
                  onClick={() => handleSave(true)}
                  disabled={saving}
                  className="px-5 py-2 text-sm font-semibold text-white rounded-xl transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: '#0F2747' }}
                >
                  Publish
                </button>
              )}
            </div>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Blog</h1>
            <p className="text-sm text-gray-500 mt-0.5">{publishedCount} published &middot; {draftCount} draft</p>
          </div>
          <button
            onClick={openCreate}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#0F2747' }}
          >
            + New Post
          </button>
        </div>

        <div className="flex gap-1 border-b border-gray-100">
          {([
            { key: 'all', label: 'All', count: posts.length },
            { key: 'published', label: 'Published', count: publishedCount },
            { key: 'draft', label: 'Drafts', count: draftCount },
          ] as const).map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === key ? 'border-[#0F2747] text-[#0F2747]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            >
              {label}
              {count > 0 && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${tab === key ? 'bg-[#0F2747] text-white' : 'bg-gray-100 text-gray-500'}`}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400 text-sm">
            {tab === 'all' ? 'No blog posts yet.' : `No ${tab} posts.`}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start gap-4">
                  {p.featured_image ? (
                    <img src={p.featured_image} alt="" className="w-16 h-16 rounded-xl border border-gray-100 object-cover bg-gray-50 flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <p className="font-semibold text-gray-900">{p.title}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {p.status === 'published' ? 'Published' : 'Draft'}
                          </span>
                          {p.blog_category?.name && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{p.blog_category.name}</span>
                          )}
                          <span className="text-xs text-gray-400 font-mono">{p.slug}</span>
                        </div>
                        {p.excerpt && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{p.excerpt}</p>}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button onClick={() => openEdit(p)} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">Edit</button>
                        <button onClick={() => handleDelete(p.id)} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors">Del</button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      {p.published_at
                        ? `Published ${new Date(p.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
                        : `Created ${new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
                      }
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
