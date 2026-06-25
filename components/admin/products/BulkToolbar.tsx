'use client'

import { useState } from 'react'
import { BulkAction, Category } from './types'

type Props = {
  count: number
  categories: Category[]
  onAction: (action: BulkAction, payload?: unknown) => void
  onClear: () => void
}

type ConfirmState = {
  action: BulkAction
  label: string
  payload?: unknown
  extra?: React.ReactNode
}

export default function BulkToolbar({ count, categories, onAction, onClear }: Props) {
  const [confirm, setConfirm] = useState<ConfirmState | null>(null)
  const [markupVal, setMarkupVal] = useState('20')
  const [categoryId, setCategoryId] = useState('')
  const [tags, setTags] = useState('')

  function trigger(action: BulkAction) {
    const labels: Record<BulkAction, string> = {
      publish: `Publish ${count} product${count !== 1 ? 's' : ''}`,
      draft: `Move ${count} product${count !== 1 ? 's' : ''} to draft`,
      delete: `Delete ${count} product${count !== 1 ? 's' : ''}`,
      markup: `Apply markup to ${count} product${count !== 1 ? 's' : ''}`,
      assign_category: `Assign category to ${count} product${count !== 1 ? 's' : ''}`,
      add_tags: `Add tags to ${count} product${count !== 1 ? 's' : ''}`,
    }

    if (action === 'markup') {
      setConfirm({
        action,
        label: labels[action],
        extra: (
          <div className="mt-3">
            <label className="text-xs text-gray-500 block mb-1">Markup percentage</label>
            <input
              type="number"
              value={markupVal}
              onChange={(e) => setMarkupVal(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#5FAE9B]"
            />
          </div>
        ),
      })
    } else if (action === 'assign_category') {
      setConfirm({
        action,
        label: labels[action],
        extra: (
          <div className="mt-3">
            <label className="text-xs text-gray-500 block mb-1">Select category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#5FAE9B] bg-white"
            >
              <option value="">Choose a category…</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        ),
      })
    } else if (action === 'add_tags') {
      setConfirm({
        action,
        label: labels[action],
        extra: (
          <div className="mt-3">
            <label className="text-xs text-gray-500 block mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. organic, rice, south-indian"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#5FAE9B]"
            />
          </div>
        ),
      })
    } else {
      setConfirm({ action, label: labels[action] })
    }
  }

  function execute() {
    if (!confirm) return
    let payload: unknown
    if (confirm.action === 'markup') payload = parseFloat(markupVal)
    else if (confirm.action === 'assign_category') payload = categoryId
    else if (confirm.action === 'add_tags') payload = tags.split(',').map((t) => t.trim()).filter(Boolean)
    onAction(confirm.action, payload)
    setConfirm(null)
  }

  return (
    <>
      <div className="bg-[#0F2747] rounded-2xl px-5 py-3 flex items-center gap-4 flex-wrap shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-white">{count} selected</span>
        </div>

        <div className="h-4 w-px bg-white/20" />

        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => trigger('publish')} className="text-xs font-medium text-white bg-[#5FAE9B] hover:bg-[#4d9a88] px-3 py-1.5 rounded-lg transition-colors">
            Publish
          </button>
          <button onClick={() => trigger('draft')} className="text-xs font-medium text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors">
            Move to Draft
          </button>
          <button onClick={() => trigger('markup')} className="text-xs font-medium text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors">
            Apply Markup
          </button>
          <button onClick={() => trigger('assign_category')} className="text-xs font-medium text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors">
            Assign Category
          </button>
          <button onClick={() => trigger('add_tags')} className="text-xs font-medium text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors">
            Add Tags
          </button>
          <button onClick={() => trigger('delete')} className="text-xs font-medium text-red-300 hover:text-red-200 bg-white/5 hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-colors">
            Delete
          </button>
        </div>

        <button onClick={onClear} className="ml-auto text-white/50 hover:text-white transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in">
            <h3 className="text-base font-bold text-gray-900">{confirm.label}</h3>
            <p className="text-sm text-gray-500 mt-1">
              {confirm.action === 'delete'
                ? 'This action cannot be undone. All selected products will be permanently removed.'
                : 'This action will be applied to all selected products.'}
            </p>
            {confirm.extra}
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setConfirm(null)}
                className="flex-1 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl py-2.5 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={execute}
                className={`flex-1 text-sm font-bold text-white rounded-xl py-2.5 transition-opacity hover:opacity-90 ${confirm.action === 'delete' ? 'bg-red-500' : 'bg-[#0F2747]'}`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
