'use client'

import { useState } from 'react'

const faqs = [
  {
    question: 'Do you offer next day delivery for Kerala groceries in the UK?',
    answer: 'Yes! We offer next day delivery across the entire UK. Place your order before 4 PM and your authentic Kerala groceries will be delivered the next day. Free delivery on orders over £40.',
  },
  {
    question: 'What Kerala grocery brands do you stock?',
    answer: 'We stock all major Kerala grocery brands including Nirapara, Eastern, Double Horse, Brahmins, Kitchen Treasures, 777, and many more. We regularly add new brands and products to our collection.',
  },
  {
    question: 'What is the minimum order for free delivery?',
    answer: 'Orders over £40 qualify for free delivery anywhere in the UK. For orders under £40, a flat delivery charge of £4.99 applies.',
  },
  {
    question: 'Can I earn rewards when shopping at PocketGrocery?',
    answer: 'Yes! Every purchase earns you Pocket Coins which you can use to discount future orders. You earn coins based on the product margin, ranging from 2 to 15 coins per product. 100 coins = £1 off.',
  },
  {
    question: 'Do you sell authentic Kerala Matta rice?',
    answer: 'Yes, we stock a wide range of authentic Kerala Matta rice including Nirapara Rose Matta Rice, Jeerakasala rice, and various other Kerala rice varieties in different pack sizes from 1kg to 10kg.',
  },
  {
    question: 'What is your return policy for groceries?',
    answer: 'We offer a 14-day return window for non-perishable items. For damaged or incorrect items, contact us within 24 hours for an immediate replacement. Fresh and frozen items can only be returned if damaged.',
  },
  {
    question: 'Do you deliver Kerala groceries to London?',
    answer: 'Yes, we deliver to all London postcodes with next day delivery. Order before 4 PM for guaranteed next day delivery anywhere in London.',
  },
  {
    question: 'How do I track my order?',
    answer: 'Once your order is dispatched, you will receive a tracking email with a link to monitor your delivery. You can also track your order from your account dashboard on our website.',
  },
]

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
}

export default function HomepageFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className="py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: '#0F2747' }}>
            Frequently Asked Questions
          </h2>
          <p className="text-gray-500 text-sm">Everything you need to know about PocketGrocery</p>
        </div>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border overflow-hidden transition-all"
              style={{ borderColor: openIndex === i ? '#5FAE9B' : '#e5e7eb' }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <span className="font-medium text-sm pr-4" style={{ color: '#0F2747' }}>{faq.question}</span>
                <svg
                  className={`w-5 h-5 shrink-0 transition-transform ${openIndex === i ? 'rotate-180' : ''}`}
                  style={{ color: '#5FAE9B' }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openIndex === i && (
                <div className="px-5 pb-5">
                  <p className="text-gray-600 text-sm leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
