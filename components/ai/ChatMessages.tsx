'use client'

import { useRef, useEffect } from 'react'
import type { ChatMessage, ProductMatch } from '@/lib/ai-assistant'
import ChatProductCard from './ChatProductCard'

interface Props {
  messages: ChatMessage[]
  onAddToCart: (product: ProductMatch) => void
  onAddAllToCart: (products: ProductMatch[]) => void
  isTyping: boolean
}

export default function ChatMessages({ messages, onAddToCart, onAddAllToCart, isTyping }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      {messages.map((msg) => (
        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div
            className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'text-white rounded-br-md'
                : 'bg-gray-50 text-gray-800 rounded-bl-md border border-gray-100'
            }`}
            style={msg.role === 'user' ? { backgroundColor: '#0F2747' } : undefined}
          >
            <p>{msg.content}</p>

            {msg.recipe && (
              <div className="mt-2 px-3 py-2 rounded-lg border border-gray-100 bg-white">
                <p className="font-semibold text-xs" style={{ color: '#0F2747' }}>{msg.recipe.name}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {msg.recipe.servings} servings &middot; {msg.recipe.time} &middot; {msg.recipe.difficulty}
                </p>
              </div>
            )}

            {msg.products && msg.products.length > 0 && (
              <div className="mt-3 space-y-2">
                {msg.products.map((p) => (
                  <ChatProductCard key={p.id} product={p} onAddToCart={onAddToCart} />
                ))}

                {msg.products.length > 1 && (
                  <button
                    onClick={() => onAddAllToCart(msg.products!)}
                    className="w-full py-2.5 rounded-xl text-white text-xs font-semibold transition-all hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2"
                    style={{ backgroundColor: '#0F2747' }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Add All to Cart (£{msg.products.reduce((s, p) => s + p.offer_price, 0).toFixed(2)})
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ))}

      {isTyping && (
        <div className="flex justify-start">
          <div className="bg-gray-50 rounded-2xl rounded-bl-md px-4 py-3 border border-gray-100">
            <div className="flex gap-1.5">
              <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
