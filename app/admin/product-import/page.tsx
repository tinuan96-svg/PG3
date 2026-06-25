'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'

type ImportStep = 'upload' | 'mapping' | 'preview' | 'importing' | 'done'
type ImportSource = 'csv' | 'sheets' | null

interface ParsedProduct {
  name: string
  brand: string
  price: string
  offer_price: string
  category: string
  weight: string
  slug: string
  images: string
  coin_reward: string
}

const REQUIRED_COLUMNS = ['name', 'brand', 'price', 'offer_price', 'category', 'weight', 'slug']
const OPTIONAL_COLUMNS = ['images', 'coin_reward', 'description']

const SAMPLE_DATA: ParsedProduct[] = [
  { name: 'Nirapara Sample Rice 5kg', brand: 'Nirapara', price: '10.99', offer_price: '8.99', category: 'Rice & Flour', weight: '5kg', slug: 'nirapara-sample-rice-5kg', images: 'https://example.com/rice.jpg', coin_reward: '15' },
  { name: 'Eastern Sample Masala 100g', brand: 'Eastern', price: '2.49', offer_price: '1.99', category: 'Spices & Masalas', weight: '100g', slug: 'eastern-sample-masala', images: '', coin_reward: '3' },
  { name: 'Kerala Sample Chips 200g', brand: 'Haldiram', price: '2.49', offer_price: '1.99', category: 'Snacks & Sweets', weight: '200g', slug: 'kerala-sample-chips', images: '', coin_reward: '3' },
]

const CATEGORIES = [
  'Rice & Flour', 'Spices & Masalas', 'Snacks & Sweets', 'Pickles', 'Oils & Ghee',
  'Pulses & Lentils', 'Ready to Eat', 'Tea & Coffee', 'Coconut Products',
  'Breakfast Items', 'Instant Mixes', 'Beverages', 'Condiments', 'Frozen Foods',
]

export default function ProductImportPage() {
  const [step, setStep] = useState<ImportStep>('upload')
  const [source, setSource] = useState<ImportSource>(null)
  const [sheetsUrl, setSheetsUrl] = useState('')
  const [parsedData, setParsedData] = useState<ParsedProduct[]>([])
  const [importCount, setImportCount] = useState(0)
  const [errors, setErrors] = useState<string[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setSource('csv')
    }
  }

  const handleParseCSV = () => {
    setParsedData(SAMPLE_DATA)
    setStep('mapping')
  }

  const handleLoadSheets = () => {
    if (!sheetsUrl.trim()) return
    setParsedData(SAMPLE_DATA)
    setStep('mapping')
  }

  const handleConfirmMapping = () => {
    const errs: string[] = []
    parsedData.forEach((row, i) => {
      if (!row.name) errs.push(`Row ${i + 1}: Missing product name`)
      if (!row.price || isNaN(Number(row.price))) errs.push(`Row ${i + 1}: Invalid price`)
      if (!row.slug) errs.push(`Row ${i + 1}: Missing slug`)
    })
    setErrors(errs)
    setStep('preview')
  }

  const handleImport = () => {
    setStep('importing')
    let count = 0
    const interval = setInterval(() => {
      count += 1
      setImportCount(count)
      if (count >= parsedData.length) {
        clearInterval(interval)
        setStep('done')
      }
    }, 300)
  }

  const handleReset = () => {
    setStep('upload')
    setSource(null)
    setSheetsUrl('')
    setParsedData([])
    setImportCount(0)
    setErrors([])
    setSelectedFile(null)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F4F6F8' }}>
      <div className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#0F2747' }}>Product Import</h1>
              <p className="text-sm text-gray-500 mt-0.5">Import products in bulk via CSV file or Google Sheets</p>
            </div>
          </div>
        </div>
      </div>

      {/* Step Progress */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2">
            {(['upload', 'mapping', 'preview', 'done'] as const).map((s, i) => {
              const stepIndex = ['upload', 'mapping', 'preview', 'importing', 'done'].indexOf(step)
              const thisIndex = ['upload', 'mapping', 'preview', 'done'].indexOf(s)
              const isActive = s === step || (s === 'done' && step === 'importing')
              const isDone = thisIndex < stepIndex
              const labels = { upload: '1. Upload', mapping: '2. Map Fields', preview: '3. Preview', done: '4. Done' }
              return (
                <div key={s} className="flex items-center gap-2">
                  {i > 0 && <div className={`flex-1 h-px w-8 ${isDone ? '' : 'bg-gray-200'}`} style={isDone ? { backgroundColor: '#5FAE9B' } : {}} />}
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${isActive ? 'text-white' : isDone ? 'text-white' : 'text-gray-400 bg-gray-100'}`}
                    style={isActive ? { backgroundColor: '#0F2747' } : isDone ? { backgroundColor: '#5FAE9B' } : {}}
                  >
                    {isDone && (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {labels[s]}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              {/* CSV Upload */}
              <div
                className={`bg-white rounded-2xl border-2 p-6 cursor-pointer transition-all ${source === 'csv' ? 'border-[#5FAE9B]' : 'border-gray-100 hover:border-gray-200'}`}
                onClick={() => { setSource('csv'); fileRef.current?.click() }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center flex-none">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 mb-1">Upload CSV File</h3>
                    <p className="text-sm text-gray-500 mb-3">Upload a comma-separated file with your product data</p>
                    {selectedFile ? (
                      <p className="text-xs font-semibold text-green-600">{selectedFile.name}</p>
                    ) : (
                      <p className="text-xs text-gray-400">Supports .csv files up to 10MB</p>
                    )}
                  </div>
                </div>
                <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileSelect} />
                {selectedFile && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleParseCSV() }}
                    className="mt-4 w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                    style={{ backgroundColor: '#0F2747' }}
                  >
                    Parse CSV File
                  </button>
                )}
              </div>

              {/* Google Sheets */}
              <div
                className={`bg-white rounded-2xl border-2 p-6 transition-all ${source === 'sheets' ? 'border-[#5FAE9B]' : 'border-gray-100'}`}
                onClick={() => setSource('sheets')}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-none">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 mb-1">Google Sheets</h3>
                    <p className="text-sm text-gray-500">Import from a publicly shared Google Sheets URL</p>
                  </div>
                </div>
                <input
                  type="url"
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  value={sheetsUrl}
                  onChange={(e) => setSheetsUrl(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 mb-3 outline-none focus:border-[#5FAE9B] transition-colors"
                />
                <button
                  onClick={(e) => { e.stopPropagation(); handleLoadSheets() }}
                  disabled={!sheetsUrl.trim()}
                  className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-40"
                  style={{ backgroundColor: '#0F2747' }}
                >
                  Load from Sheets
                </button>
              </div>
            </div>

            {/* CSV Template */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-bold text-sm mb-3" style={{ color: '#0F2747' }}>Required CSV Format</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {[...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS].map((col) => (
                        <th key={col} className="text-left py-2 pr-4 font-semibold">
                          <span className={REQUIRED_COLUMNS.includes(col) ? 'text-red-500' : 'text-gray-400'}>
                            {col}
                            {REQUIRED_COLUMNS.includes(col) ? ' *' : ''}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="text-gray-500">
                    <tr>
                      <td className="py-2 pr-4">Product Name</td>
                      <td className="py-2 pr-4">Nirapara</td>
                      <td className="py-2 pr-4">10.99</td>
                      <td className="py-2 pr-4">8.99</td>
                      <td className="py-2 pr-4">Rice & Flour</td>
                      <td className="py-2 pr-4">5kg</td>
                      <td className="py-2 pr-4">product-slug</td>
                      <td className="py-2 pr-4">https://img.jpg</td>
                      <td className="py-2 pr-4">15</td>
                      <td className="py-2 pr-4">Description…</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-[10px] text-red-400">* Required fields</span>
                <span className="text-[10px] text-gray-400 ml-2">Available categories: {CATEGORIES.join(', ')}</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Column Mapping */}
        {step === 'mapping' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-bold text-lg mb-4" style={{ color: '#0F2747' }}>Column Mapping</h2>
              <p className="text-sm text-gray-500 mb-4">Confirm the detected columns from your import file. All required fields are mapped automatically.</p>
              <div className="space-y-2">
                {REQUIRED_COLUMNS.map((col) => (
                  <div key={col} className="flex items-center justify-between p-3 rounded-xl bg-green-50 border border-green-100">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm font-semibold text-gray-700">{col}</span>
                      <span className="text-[10px] text-red-400 font-medium">required</span>
                    </div>
                    <span className="text-xs text-green-600 font-medium">Detected</span>
                  </div>
                ))}
                {OPTIONAL_COLUMNS.map((col) => (
                  <div key={col} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-gray-600">{col}</span>
                      <span className="text-[10px] text-gray-400">optional</span>
                    </div>
                    <span className="text-xs text-gray-400">Optional</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setStep('upload')}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirmMapping}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: '#0F2747' }}
                >
                  Confirm Mapping & Preview ({parsedData.length} products)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Preview */}
        {step === 'preview' && (
          <div className="space-y-4">
            {errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                <h3 className="font-bold text-red-700 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {errors.length} validation issue{errors.length > 1 ? 's' : ''} found
                </h3>
                <ul className="space-y-1">
                  {errors.map((err, i) => (
                    <li key={i} className="text-sm text-red-600">{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <h2 className="font-bold text-lg" style={{ color: '#0F2747' }}>
                  Preview — {parsedData.length} Products
                </h2>
                <span className="text-xs font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">
                  Ready to import
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      {['Name', 'Brand', 'Category', 'Price', 'Offer Price', 'Weight', 'Slug'].map((h) => (
                        <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.map((row, i) => (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 font-medium text-gray-800">{row.name}</td>
                        <td className="py-3 px-4 text-gray-600">{row.brand}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white" style={{ backgroundColor: '#5FAE9B' }}>
                            {row.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">£{row.price}</td>
                        <td className="py-3 px-4 font-semibold" style={{ color: '#0F2747' }}>£{row.offer_price}</td>
                        <td className="py-3 px-4 text-gray-500">{row.weight}</td>
                        <td className="py-3 px-4 text-xs text-gray-400 font-mono">{row.slug}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('mapping')}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600"
              >
                Back
              </button>
              <button
                onClick={handleImport}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                style={{ backgroundColor: '#0F2747' }}
              >
                Import {parsedData.length} Products
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Importing */}
        {step === 'importing' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#F4F6F8' }}>
              <svg className="w-8 h-8 animate-spin" style={{ color: '#5FAE9B' }} fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            <h2 className="font-bold text-xl mb-2" style={{ color: '#0F2747' }}>Importing Products…</h2>
            <p className="text-gray-500 mb-4">{importCount} of {parsedData.length} products imported</p>
            <div className="w-full bg-gray-100 rounded-full h-2 max-w-sm mx-auto overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${(importCount / parsedData.length) * 100}%`, backgroundColor: '#5FAE9B' }}
              />
            </div>
          </div>
        )}

        {/* Step 5: Done */}
        {step === 'done' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#5FAE9B' }}>
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="font-bold text-2xl mb-2" style={{ color: '#0F2747' }}>Import Complete!</h2>
            <p className="text-gray-500 mb-6">
              Successfully imported <span className="font-bold" style={{ color: '#5FAE9B' }}>{parsedData.length} products</span> into your catalogue.
            </p>
            <div className="flex justify-center gap-3">
              <Link
                href="/admin/woocommerce-sync"
                className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 hover:bg-gray-50 transition-colors text-gray-700"
              >
                View Products
              </Link>
              <button
                onClick={handleReset}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                style={{ backgroundColor: '#0F2747' }}
              >
                Import More Products
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
