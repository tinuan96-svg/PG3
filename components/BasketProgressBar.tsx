'use client'

interface BasketProgressBarProps {
  cartTotal: number
  threshold?: number
}

export default function BasketProgressBar({
  cartTotal,
  threshold = 40
}: BasketProgressBarProps) {
  const remaining = Math.max(0, threshold - cartTotal)
  const percentage = Math.min(100, (cartTotal / threshold) * 100)
  const isFree = cartTotal >= threshold

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isFree ? 'bg-green-100 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          </div>
          <div>
            {isFree ? (
              <p className="font-extrabold text-green-600 text-base leading-tight">
                Free Delivery Qualified!
              </p>
            ) : (
              <p className="font-bold text-gray-900 text-base leading-tight">
                Add <span style={{ color: '#5FAE9B' }}>£{remaining.toFixed(2)}</span> for FREE delivery
              </p>
            )}
            <p className="text-xs text-gray-400 font-medium">Standard delivery is £3.99</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-sm font-extrabold" style={{ color: '#0F2747' }}>{Math.round(percentage)}%</span>
        </div>
      </div>

      <div className="relative w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full transition-all duration-1000 ease-out rounded-full"
          style={{
            width: `${percentage}%`,
            backgroundColor: isFree ? '#22c55e' : '#5FAE9B'
          }}
        >
          <div className="absolute inset-0 bg-white opacity-20 animate-pulse"></div>
        </div>
      </div>

      {isFree && (
        <div className="mt-4 flex items-center gap-2 text-green-700 bg-green-50 px-3 py-2 rounded-lg border border-green-100">
          <svg className="w-4 h-4 flex-none" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-[11px] font-bold uppercase tracking-wider">Checkout now to enjoy free next day delivery</span>
        </div>
      )}
    </div>
  )
}
