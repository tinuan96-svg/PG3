'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { generateResponse, type ChatMessage, type ProductMatch } from '@/lib/ai-assistant'
import ChatMessages from './ai/ChatMessages'
import QuickActions from './ai/QuickActions'
import { addToCart } from '@/lib/cart'

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: 'Welcome to PocketGrocery! I can help you find products, build recipe ingredient lists, or answer questions. What are you looking for today?',
  type: 'text',
}

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set())
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  const sendMessage = useCallback((text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      type: 'text',
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    setTimeout(() => {
      const response = generateResponse(trimmed)
      setMessages((prev) => [...prev, response])
      setIsTyping(false)
    }, 600 + Math.random() * 400)
  }, [])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      sendMessage(input)
    },
    [input, sendMessage]
  )

  const handleAddToCart = useCallback((product: ProductMatch) => {
    addToCart({
      product_id: product.id,
      product_name: product.name,
      product_image: product.image,
      unit_price: product.offer_price ?? product.price,
    })
    setAddedItems((prev) => new Set([...prev, product.id]))
    setTimeout(() => {
      setAddedItems((prev) => {
        const next = new Set(prev)
        next.delete(product.id)
        return next
      })
    }, 2000)
  }, [])

  const handleAddAllToCart = useCallback((products: ProductMatch[]) => {
    products.forEach((product) => {
      addToCart({
        product_id: product.id,
        product_name: product.name,
        product_image: product.image,
        unit_price: product.offer_price ?? product.price,
      })
    })
    const ids = products.map((p) => p.id)
    setAddedItems((prev) => new Set([...prev, ...ids]))
    setTimeout(() => {
      setAddedItems((prev) => {
        const next = new Set(prev)
        ids.forEach((id) => next.delete(id))
        return next
      })
    }, 2000)
  }, [])

  const notificationCount = addedItems.size

  return (
    <>
      <div
        className="fixed inset-0 z-[55] transition-all duration-300"
        style={{
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          backgroundColor: 'rgba(15, 39, 71, 0.2)',
          backdropFilter: isOpen ? 'blur(2px)' : 'blur(0)',
        }}
        onClick={() => setIsOpen(false)}
      />

      <div
        className="fixed z-[60] transition-all duration-300 ease-out"
        style={{
          bottom: isOpen ? '0' : 'calc(env(safe-area-inset-bottom) + 85px)',
          left: isOpen ? '0' : '16px',
          right: isOpen ? '0' : 'auto',
          top: isOpen ? '0' : 'auto',
          width: isOpen ? '100%' : 'auto',
          height: isOpen ? '100%' : 'auto',
          visibility: isOpen ? 'visible' : 'hidden',
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
      >
        {isOpen ? (
          <div className="w-full h-full sm:w-[400px] sm:h-[600px] sm:max-h-[85vh] sm:absolute sm:bottom-6 sm:left-5 sm:right-auto sm:top-auto flex flex-col bg-white sm:rounded-2xl sm:shadow-2xl overflow-hidden">
            <div
              className="flex items-center justify-between px-4 py-3 shrink-0"
              style={{ backgroundColor: '#0F2747' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#5FAE9B' }}>
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white text-sm font-semibold">PocketGrocery AI</h3>
                  <p className="text-gray-400 text-[10px]">Smart grocery assistant</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <ChatMessages
              messages={messages}
              onAddToCart={handleAddToCart}
              onAddAllToCart={handleAddAllToCart}
              isTyping={isTyping}
            />

            {messages.length <= 1 && <QuickActions onSelect={sendMessage} />}

            <form onSubmit={handleSubmit} className="px-3 py-3 border-t border-gray-100 shrink-0">
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about products, recipes, delivery..."
                  className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
                  disabled={isTyping}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white transition-all disabled:opacity-30 active:scale-90"
                  style={{ backgroundColor: '#5FAE9B' }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        ) : (
          <button
            onClick={() => setIsOpen(true)}
            className="ai-chat-btn group flex items-center gap-2.5 rounded-full pl-4 pr-5 py-3 text-white shadow-lg transition-all duration-300 hover:shadow-xl active:scale-95"
            style={{ backgroundColor: '#0F2747' }}
            aria-label="Open AI grocery assistant"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#5FAE9B' }}>
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-sm font-semibold">AI Assistant</span>
            {notificationCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-white" style={{ backgroundColor: '#5FAE9B' }}>
                {notificationCount}
              </span>
            )}
          </button>
        )}
      </div>
    </>
  )
}
