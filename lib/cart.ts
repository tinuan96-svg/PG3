const CART_KEY = 'pg_cart'
const CART_EVENT = 'cart-updated'

export interface CartItem {
  product_id: string
  product_name: string
  product_image?: string
  quantity: number
  unit_price: number
}

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) ?? '[]')
  } catch {
    return []
  }
}

export function saveCart(items: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items))
  window.dispatchEvent(new Event(CART_EVENT))
}

export function clearCart() {
  localStorage.removeItem(CART_KEY)
  window.dispatchEvent(new Event(CART_EVENT))
}

export function addToCart(item: Omit<CartItem, 'quantity'> & { quantity?: number }) {
  const cart = getCart()
  const qty = item.quantity ?? 1
  const existing = cart.findIndex((i) => i.product_id === item.product_id)
  if (existing >= 0) {
    cart[existing].quantity += qty
  } else {
    cart.push({ ...item, quantity: qty })
  }
  saveCart(cart)
}

export function getCartCount(): number {
  return getCart().reduce((sum, i) => sum + i.quantity, 0)
}

export function onCartUpdate(fn: () => void): () => void {
  window.addEventListener(CART_EVENT, fn)
  return () => window.removeEventListener(CART_EVENT, fn)
}
