'use client'

import Link from 'next/link'
import Image from 'next/image'
import AccountLayout from '@/components/AccountLayout'
import { useWishlist } from '@/lib/wishlist-context'
import { addToCart } from '@/lib/cart'
import { Trash2, ShoppingCart, ShoppingBag, Heart } from 'lucide-react'
import { useState } from 'react'

export default function WishlistPage() {
  const { wishlist, removeFromWishlist, wishlistCount } = useWishlist()
  const [addedId, setAddedId] = useState<string | null>(null)

  function handleAddToCart(item: {
    id: string;
    name: string;
    image_url: string | null;
    price: number;
  }) {
    addToCart({
      product_id: item.id,
      product_name: item.name,
      product_image: item.image_url,
      unit_price: item.price,
      quantity: 1
    })
    setAddedId(item.id)
    setTimeout(() => setAddedId(null), 1500)
  }

  return (
    <AccountLayout>
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">My Wishlist</h2>
              <p className="text-sm text-gray-500 mt-0.5">Saved items for later purchase</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
               <Heart className="w-5 h-5 text-red-500 fill-red-500" />
            </div>
          </div>

          <div className="p-6">
            {wishlistCount === 0 ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Your wishlist is empty</h3>
                  <p className="text-gray-500 text-sm max-w-xs mx-auto">
                    Browse our collection and tap the heart icon to save products you love.
                  </p>
                </div>
                <Link
                  href="/products"
                  className="inline-block px-6 py-2.5 bg-[#0F2747] text-white rounded-xl text-sm font-semibold hover:opacity-90"
                >
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {wishlist.map((item) => (
                  <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex items-center gap-4">
                    <Link href={`/products/${item.slug}`} className="w-20 h-20 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 relative">
                      <Image
                        src={item.image_url || 'https://images.pexels.com/photos/4110255/pexels-photo-4110255.jpeg?auto=compress&cs=tinysrgb&w=400'}
                        alt={item.name}
                        fill
                        className="object-contain p-2"
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={`/products/${item.slug}`} className="text-sm font-bold text-gray-900 hover:text-[#0F2747] line-clamp-1">
                        {item.name}
                      </Link>
                      <p className="text-sm font-bold mt-0.5" style={{ color: '#0F2747' }}>
                        £{Number(item.price).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAddToCart(item)}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${addedId === item.id ? 'bg-[#5FAE9B] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        title="Add to cart"
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeFromWishlist(item.id)}
                        className="w-9 h-9 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"
                        title="Remove from wishlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {wishlistCount > 0 && (
           <div className="bg-[#EBF4F1] rounded-2xl p-4 flex gap-3 items-center">
             <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                <ShoppingCart className="w-5 h-5 text-[#5FAE9B]" />
             </div>
             <div className="text-sm text-gray-700">
               <p className="font-bold">Ready to checkout?</p>
               <p className="text-xs">Add your favorites to cart and enjoy next day UK delivery.</p>
             </div>
             <Link href="/cart" className="ml-auto px-4 py-2 bg-white rounded-xl text-xs font-bold text-[#0F2747] shadow-sm hover:bg-gray-50 transition-colors">
               Go to Cart
             </Link>
           </div>
        )}
      </div>
    </AccountLayout>
  )
}
