'use client'

import { useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // Opens default mail client with prefilled content
    const body = encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`)
    const subject = encodeURIComponent(form.subject || 'Customer Enquiry - PocketGrocery')
    window.location.href = `mailto:info@pocketgrocery.com?subject=${subject}&body=${body}`
    setSubmitted(true)
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-[#0F2747] mb-4">Contact Us</h1>
            <p className="text-lg text-gray-600">
              Have a question or need help? We&apos;re here for you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="w-10 h-10 rounded-xl mb-4 flex items-center justify-center" style={{ backgroundColor: '#EBF4F1' }}>
                  <svg className="w-5 h-5" fill="none" stroke="#5FAE9B" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-bold text-[#0F2747] mb-1">Email</h3>
                <a href="mailto:info@pocketgrocery.com" className="text-sm hover:underline" style={{ color: '#5FAE9B' }}>
                  info@pocketgrocery.com
                </a>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="w-10 h-10 rounded-xl mb-4 flex items-center justify-center" style={{ backgroundColor: '#EBF4F1' }}>
                  <svg className="w-5 h-5" fill="none" stroke="#5FAE9B" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <h3 className="font-bold text-[#0F2747] mb-1">Phone</h3>
                <a href="tel:079826003" className="text-sm hover:underline" style={{ color: '#5FAE9B' }}>
                  079826003
                </a>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="w-10 h-10 rounded-xl mb-4 flex items-center justify-center" style={{ backgroundColor: '#EBF4F1' }}>
                  <svg className="w-5 h-5" fill="none" stroke="#5FAE9B" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="font-bold text-[#0F2747] mb-1">Address</h3>
                <p className="text-sm text-gray-600">52 Oldfields Road, Sutton</p>
                <p className="text-sm text-gray-600">United Kingdom, SM1 2NU</p>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-[#0F2747] mb-2">Order Support</h3>
                <p className="text-sm text-gray-600 mb-3">For order issues, tracking, or returns:</p>
                <Link href="/account/orders" className="text-sm font-medium hover:underline" style={{ color: '#5FAE9B' }}>
                  View My Orders
                </Link>
              </div>
            </div>

            <div className="md:col-span-2">
              {submitted ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                  <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#EBF4F1' }}>
                    <svg className="w-8 h-8" fill="none" stroke="#5FAE9B" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-[#0F2747] mb-2">Your email client has opened</h2>
                  <p className="text-gray-600 mb-6">Complete sending the email from your mail app. We typically respond within 24 hours.</p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="text-sm font-medium hover:underline"
                    style={{ color: '#5FAE9B' }}
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                  <h2 className="text-xl font-bold text-[#0F2747] mb-6">Send us a message</h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Name</label>
                        <input
                          type="text"
                          required
                          value={form.name}
                          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#5FAE9B] transition-colors"
                          placeholder="e.g. Priya Thomas"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                        <input
                          type="email"
                          required
                          value={form.email}
                          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#5FAE9B] transition-colors"
                          placeholder="you@example.com"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
                      <input
                        type="text"
                        value={form.subject}
                        onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#5FAE9B] transition-colors"
                        placeholder="e.g. Question about my order"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
                      <textarea
                        required
                        rows={6}
                        value={form.message}
                        onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#5FAE9B] transition-colors resize-none"
                        placeholder="How can we help you?"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full text-white font-semibold py-3 rounded-xl transition-opacity hover:opacity-90"
                      style={{ backgroundColor: '#0F2747' }}
                    >
                      Send Message
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
