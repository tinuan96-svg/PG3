import { findRecipeByQuery, findRecipesByKeyword, type Recipe, type RecipeIngredient } from './ai-recipes'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  type: 'text' | 'products' | 'recipe' | 'faq'
  products?: ProductMatch[]
  recipe?: Recipe
}

export interface ProductMatch {
  id: string
  name: string
  brand: string
  price: number
  offer_price: number
  image: string
  slug: string
  coin_reward: number
  weight: string
  matchedIngredient?: string
}

const FAQ_ENTRIES: { patterns: string[]; answer: string }[] = [
  {
    patterns: ['delivery', 'shipping', 'deliver', 'how long', 'when will', 'next day'],
    answer: 'We offer next day delivery across the entire UK when you order before 4 PM. Orders placed after 4 PM are delivered the following day. Saturday orders placed before 4 PM are delivered on Monday.',
  },
  {
    patterns: ['free delivery', 'delivery charge', 'delivery cost', 'shipping cost', 'delivery fee'],
    answer: 'Delivery is FREE on orders over £40. For orders under £40, a flat delivery fee of £4.99 applies. Simply add more items to qualify for free delivery!',
  },
  {
    patterns: ['return', 'refund', 'exchange', 'damaged', 'wrong item', 'incorrect', 'broken'],
    answer: 'If you receive damaged, incorrect, or missing items, contact us within 48 hours of delivery. We will arrange a free replacement or full refund — no hassle, no return shipping needed for perishable items.',
  },
  {
    patterns: ['return policy', 'refund policy', 'returns policy'],
    answer: 'Our returns policy: Damaged or incorrect items must be reported within 48 hours. We offer full refunds or free replacements. Non-perishable items can be returned within 14 days unopened. Perishable goods (fresh items) cannot be returned but we will issue a refund if there is a quality issue.',
  },
  {
    patterns: ['payment', 'pay', 'card', 'stripe', 'visa', 'mastercard', 'apple pay'],
    answer: 'We accept all major credit and debit cards (Visa, Mastercard, Amex) through our secure Stripe payment system. Apple Pay and Google Pay are also accepted. Your payment details are never stored on our servers.',
  },
  {
    patterns: ['coin', 'pocket coin', 'reward', 'loyalty', 'points', 'wallet coins', 'coins system', 'earn coins'],
    answer: 'The Pocket Wallet is our loyalty rewards system. You earn Pocket Coins on every purchase — each product shows its coin reward. 1 Pocket Coin = £0.01 discount at checkout. You also earn: 100 coins when you refer a friend (they get 50 too!), and 5 coins for daily logins. Check your balance in My Account → Pocket Wallet.',
  },
  {
    patterns: ['how to redeem', 'use coins', 'spend coins', 'redeem coins', 'apply coins'],
    answer: 'Redeem your Pocket Coins at checkout. Simply select how many coins to apply and the discount is instantly deducted. 1 coin = £0.01 off your order. There is no minimum redemption amount.',
  },
  {
    patterns: ['referral', 'refer friend', 'referral code', 'invite friend'],
    answer: 'Share your unique referral code from My Account → Referrals. When a friend uses your code and places their first order, you earn 100 Pocket Coins and they earn 50 coins as a welcome bonus. There is no limit on how many friends you can refer!',
  },
  {
    patterns: ['contact', 'support', 'help', 'phone', 'email us', 'customer service', 'customer support'],
    answer: 'Our customer support team is available 7 days a week. You can reach us via the Contact Us page on our website, or email support@pocketgrocery.co.uk. We aim to respond to all queries within 2-4 hours during business hours.',
  },
  {
    patterns: ['area', 'location', 'where', 'city', 'cities', 'deliver to', 'do you deliver'],
    answer: 'We deliver to the entire United Kingdom — England, Scotland, Wales, and Northern Ireland. This includes all major cities: London, Manchester, Birmingham, Leeds, Glasgow, Edinburgh, Leicester, Coventry, and everywhere in between.',
  },
  {
    patterns: ['track', 'order status', 'where is my order', 'tracking', 'order tracking'],
    answer: 'Track your order in My Account → My Orders. You will receive email updates at each stage: order confirmed, dispatched, and out for delivery. A tracking link is included in the dispatch email.',
  },
  {
    patterns: ['cancel', 'cancel order', 'change order'],
    answer: 'Orders can be cancelled within 1 hour of placing them. After that, the order enters processing and cannot be cancelled. To cancel, go to My Account → Orders or contact us immediately at support@pocketgrocery.co.uk.',
  },
  {
    patterns: ['minimum order', 'minimum', 'minimum spend'],
    answer: 'There is no minimum order amount. However, we recommend ordering over £40 to qualify for free delivery and save on the £4.99 delivery charge.',
  },
  {
    patterns: ['fresh', 'expiry', 'best before', 'quality', 'authentic'],
    answer: 'All our products are sourced directly from trusted Kerala and Indian food manufacturers. We stock items with long best-before dates and rotate stock regularly. Products are carefully packed to prevent damage during delivery.',
  },
  {
    patterns: ['account', 'sign up', 'register', 'create account', 'login', 'forgot password'],
    answer: 'Sign in to PocketGrocery using your phone number and a one-time password (OTP). Simply enter your number on the sign-in page, and we will send you a 6-digit code via SMS. Once signed in, you can track orders, earn Pocket Coins, and manage your delivery addresses.',
  },
]

const PRODUCT_CATALOG: ProductMatch[] = [
  { id: '1', name: 'Nirapara Chemba Puttu Podi', brand: 'Nirapara', price: 3.49, offer_price: 2.99, image: 'https://images.pexels.com/photos/4110251/pexels-photo-4110251.jpeg?auto=compress&cs=tinysrgb&w=400', slug: 'nirapara-chemba-puttu-podi', coin_reward: 5, weight: '1kg' },
  { id: '2', name: 'Eastern Sambar Powder 100g', brand: 'Eastern', price: 2.29, offer_price: 1.89, image: 'https://images.pexels.com/photos/2802527/pexels-photo-2802527.jpeg?auto=compress&cs=tinysrgb&w=400', slug: 'eastern-sambar-powder', coin_reward: 3, weight: '100g' },
  { id: '3', name: 'Double Horse Appam Podi 1kg', brand: 'Double Horse', price: 4.29, offer_price: 3.49, image: 'https://images.pexels.com/photos/4110255/pexels-photo-4110255.jpeg?auto=compress&cs=tinysrgb&w=400', slug: 'double-horse-appam-podi', coin_reward: 6, weight: '1kg' },
  { id: '4', name: 'Brahmins Fish Curry Masala', brand: 'Brahmins', price: 1.99, offer_price: 1.49, image: 'https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg?auto=compress&cs=tinysrgb&w=400', slug: 'brahmins-fish-curry-masala', coin_reward: 2, weight: '100g' },
  { id: '5', name: 'Kitchen Treasures Pickle Mix', brand: 'Kitchen Treasures', price: 3.29, offer_price: 2.79, image: 'https://images.pexels.com/photos/5419336/pexels-photo-5419336.jpeg?auto=compress&cs=tinysrgb&w=400', slug: 'kitchen-treasures-pickle-mix', coin_reward: 4, weight: '400g' },
  { id: '6', name: '777 Mango Pickle 300g', brand: '777', price: 2.99, offer_price: 2.49, image: 'https://images.pexels.com/photos/5419337/pexels-photo-5419337.jpeg?auto=compress&cs=tinysrgb&w=400', slug: '777-mango-pickle', coin_reward: 4, weight: '300g' },
  { id: '7', name: 'Nirapara Rose Matta Rice 5kg', brand: 'Nirapara', price: 10.99, offer_price: 8.99, image: 'https://images.pexels.com/photos/4110252/pexels-photo-4110252.jpeg?auto=compress&cs=tinysrgb&w=400', slug: 'nirapara-rose-matta-rice-5kg', coin_reward: 15, weight: '5kg' },
  { id: '8', name: 'Eastern Chicken Masala 100g', brand: 'Eastern', price: 2.49, offer_price: 1.99, image: 'https://images.pexels.com/photos/2474658/pexels-photo-2474658.jpeg?auto=compress&cs=tinysrgb&w=400', slug: 'eastern-chicken-masala', coin_reward: 3, weight: '100g' },
  { id: '9', name: 'Haldiram Banana Chips 200g', brand: 'Haldiram', price: 2.49, offer_price: 1.99, image: 'https://images.pexels.com/photos/5848575/pexels-photo-5848575.jpeg?auto=compress&cs=tinysrgb&w=400', slug: 'haldiram-banana-chips', coin_reward: 3, weight: '200g' },
  { id: '10', name: 'Kerala Coconut Oil 500ml', brand: 'KPL Shudhi', price: 5.99, offer_price: 4.99, image: 'https://images.pexels.com/photos/725998/pexels-photo-725998.jpeg?auto=compress&cs=tinysrgb&w=400', slug: 'kerala-coconut-oil-500ml', coin_reward: 8, weight: '500ml' },
  { id: '11', name: 'Nirapara Idiyappam Podi 1kg', brand: 'Nirapara', price: 3.99, offer_price: 3.29, image: 'https://images.pexels.com/photos/4110253/pexels-photo-4110253.jpeg?auto=compress&cs=tinysrgb&w=400', slug: 'nirapara-idiyappam-podi', coin_reward: 5, weight: '1kg' },
  { id: '12', name: 'Eastern Turmeric Powder 250g', brand: 'Eastern', price: 2.79, offer_price: 2.29, image: 'https://images.pexels.com/photos/4198370/pexels-photo-4198370.jpeg?auto=compress&cs=tinysrgb&w=400', slug: 'eastern-turmeric-powder', coin_reward: 3, weight: '250g' },
  { id: '13', name: 'Brahmins Aviyal Curry Mix', brand: 'Brahmins', price: 1.99, offer_price: 1.69, image: 'https://images.pexels.com/photos/2474660/pexels-photo-2474660.jpeg?auto=compress&cs=tinysrgb&w=400', slug: 'brahmins-aviyal-curry-mix', coin_reward: 2, weight: '200g' },
  { id: '14', name: 'Double Horse Jeerakasala Rice 2kg', brand: 'Double Horse', price: 7.99, offer_price: 6.99, image: 'https://images.pexels.com/photos/4110254/pexels-photo-4110254.jpeg?auto=compress&cs=tinysrgb&w=400', slug: 'double-horse-jeerakasala-rice', coin_reward: 10, weight: '2kg' },
  { id: '15', name: 'Melam Kashmiri Chilli Powder 400g', brand: 'Melam', price: 3.99, offer_price: 3.49, image: 'https://images.pexels.com/photos/2802526/pexels-photo-2802526.jpeg?auto=compress&cs=tinysrgb&w=400', slug: 'melam-kashmiri-chilli-powder', coin_reward: 5, weight: '400g' },
  { id: '16', name: 'Priya Lime Pickle 300g', brand: 'Priya', price: 2.69, offer_price: 2.19, image: 'https://images.pexels.com/photos/5419338/pexels-photo-5419338.jpeg?auto=compress&cs=tinysrgb&w=400', slug: 'priya-lime-pickle', coin_reward: 3, weight: '300g' },
  { id: '17', name: 'Paragon Banana Chips Kerala Style', brand: 'Paragon', price: 2.99, offer_price: 2.49, image: 'https://images.pexels.com/photos/5848576/pexels-photo-5848576.jpeg?auto=compress&cs=tinysrgb&w=400', slug: 'paragon-banana-chips', coin_reward: 4, weight: '200g' },
  { id: '18', name: 'Jayanti Pure Ghee 500ml', brand: 'Jayanti', price: 7.49, offer_price: 6.49, image: 'https://images.pexels.com/photos/725999/pexels-photo-725999.jpeg?auto=compress&cs=tinysrgb&w=400', slug: 'jayanti-pure-ghee', coin_reward: 10, weight: '500ml' },
  { id: '19', name: 'Nirapara Dosa Podi 1kg', brand: 'Nirapara', price: 3.79, offer_price: 3.19, image: 'https://images.pexels.com/photos/4110256/pexels-photo-4110256.jpeg?auto=compress&cs=tinysrgb&w=400', slug: 'nirapara-dosa-podi', coin_reward: 5, weight: '1kg' },
  { id: '20', name: 'Eastern Garam Masala 100g', brand: 'Eastern', price: 2.69, offer_price: 2.19, image: 'https://images.pexels.com/photos/2802528/pexels-photo-2802528.jpeg?auto=compress&cs=tinysrgb&w=400', slug: 'eastern-garam-masala', coin_reward: 3, weight: '100g' },
  { id: '21', name: 'Brahmins Payasam Mix 200g', brand: 'Brahmins', price: 2.99, offer_price: 2.49, image: 'https://images.pexels.com/photos/4110257/pexels-photo-4110257.jpeg?auto=compress&cs=tinysrgb&w=400', slug: 'brahmins-payasam-mix', coin_reward: 4, weight: '200g' },
  { id: '22', name: 'Kerala Tapioca Chips 250g', brand: 'Kitchen Treasures', price: 2.49, offer_price: 1.99, image: 'https://images.pexels.com/photos/5848577/pexels-photo-5848577.jpeg?auto=compress&cs=tinysrgb&w=400', slug: 'kerala-tapioca-chips', coin_reward: 3, weight: '250g' },
  { id: '23', name: 'Milma Cardamom Tea Powder 250g', brand: 'Milma', price: 4.49, offer_price: 3.99, image: 'https://images.pexels.com/photos/1417945/pexels-photo-1417945.jpeg?auto=compress&cs=tinysrgb&w=400', slug: 'milma-cardamom-tea', coin_reward: 6, weight: '250g' },
  { id: '24', name: 'Brahmins Sambar Powder 200g', brand: 'Brahmins', price: 2.89, offer_price: 2.39, image: 'https://images.pexels.com/photos/2474662/pexels-photo-2474662.jpeg?auto=compress&cs=tinysrgb&w=400', slug: 'brahmins-sambar-powder', coin_reward: 3, weight: '200g' },
]

type Intent = 'recipe' | 'product_search' | 'faq' | 'greeting' | 'unknown'

function detectIntent(message: string): Intent {
  const m = message.toLowerCase().trim()

  if (/^(hi|hello|hey|good morning|good evening|howdy)[\s!?.]*$/i.test(m)) return 'greeting'

  const recipePatterns = ['recipe', 'ingredients for', 'how to make', 'how to cook', 'i need ingredients', 'cook', 'biryani', 'curry', 'sambar', 'puttu', 'appam', 'dosa', 'payasam', 'pradhaman', 'avial', 'weekly grocery', 'weekly essentials']
  if (recipePatterns.some((p) => m.includes(p))) return 'recipe'

  const faqPatterns = FAQ_ENTRIES.flatMap((f) => f.patterns)
  if (faqPatterns.some((p) => m.includes(p))) return 'faq'

  return 'product_search'
}

function searchProducts(query: string): ProductMatch[] {
  const q = query.toLowerCase()
  const terms = q.split(/\s+/).filter((t) => t.length > 2)

  const scored = PRODUCT_CATALOG.map((product) => {
    const haystack = `${product.name} ${product.brand}`.toLowerCase()
    let score = 0
    if (haystack.includes(q)) score += 10
    terms.forEach((term) => {
      if (haystack.includes(term)) score += 3
    })
    return { product, score }
  })

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((s) => s.product)
}

function matchRecipeIngredients(ingredients: RecipeIngredient[]): ProductMatch[] {
  const matched: ProductMatch[] = []
  const usedIds = new Set<string>()

  for (const ing of ingredients) {
    const allTerms = [ing.name.toLowerCase(), ...ing.searchTerms.map((t) => t.toLowerCase())]

    let bestMatch: { product: ProductMatch; score: number } | null = null
    for (const product of PRODUCT_CATALOG) {
      if (usedIds.has(product.id)) continue
      const haystack = `${product.name} ${product.brand}`.toLowerCase()
      let score = 0
      for (const term of allTerms) {
        if (haystack.includes(term)) score += 5
        const words = term.split(/\s+/)
        words.forEach((w) => { if (w.length > 3 && haystack.includes(w)) score += 2 })
      }
      if (score > 0 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { product, score }
      }
    }

    if (bestMatch) {
      usedIds.add(bestMatch.product.id)
      matched.push({ ...bestMatch.product, matchedIngredient: ing.name })
    }
  }

  return matched
}

function findFaqAnswer(message: string): string {
  const m = message.toLowerCase()
  for (const faq of FAQ_ENTRIES) {
    if (faq.patterns.some((p) => m.includes(p))) {
      return faq.answer
    }
  }
  return ''
}

export function generateResponse(userMessage: string): ChatMessage {
  const intent = detectIntent(userMessage)
  const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

  switch (intent) {
    case 'greeting':
      return {
        id,
        role: 'assistant',
        content: 'Hello! I\'m your PocketGrocery AI assistant. I can help you find products, suggest recipe ingredients, or answer questions about delivery and orders. What can I help you with?',
        type: 'text',
      }

    case 'recipe': {
      const recipe = findRecipeByQuery(userMessage)
      if (recipe) {
        const products = matchRecipeIngredients(recipe.ingredients)
        return {
          id,
          role: 'assistant',
          content: `Here are the ingredients you need for ${recipe.name}. I found ${products.length} matching products in our store:`,
          type: 'recipe',
          recipe,
          products,
        }
      }
      const recipes = findRecipesByKeyword(userMessage)
      if (recipes.length > 0) {
        const first = recipes[0]
        const products = matchRecipeIngredients(first.ingredients)
        return {
          id,
          role: 'assistant',
          content: `I found a recipe for ${first.name}! Here are the ingredients you can add to your cart:`,
          type: 'recipe',
          recipe: first,
          products,
        }
      }
      return {
        id,
        role: 'assistant',
        content: 'I couldn\'t find a specific recipe for that. Try asking about popular Kerala dishes like fish curry, biryani, sambar, puttu, appam, or dosa. You can also say "weekly grocery essentials" for basic items.',
        type: 'text',
      }
    }

    case 'faq': {
      const answer = findFaqAnswer(userMessage)
      return { id, role: 'assistant', content: answer, type: 'faq' }
    }

    case 'product_search':
    default: {
      const products = searchProducts(userMessage)
      if (products.length > 0) {
        return {
          id,
          role: 'assistant',
          content: `I found ${products.length} product${products.length > 1 ? 's' : ''} matching your search:`,
          type: 'products',
          products,
        }
      }
      return {
        id,
        role: 'assistant',
        content: 'I couldn\'t find products matching that query. Try searching for items like rice, spices, pickles, snacks, or specific brands like Nirapara, Eastern, or Double Horse.',
        type: 'text',
      }
    }
  }
}

export const QUICK_ACTIONS = [
  { label: 'Kerala Fish Curry ingredients', icon: 'fish' },
  { label: 'Weekly grocery essentials', icon: 'cart' },
  { label: 'Best Kerala snacks', icon: 'snack' },
  { label: 'Delivery information', icon: 'delivery' },
  { label: 'Rice varieties', icon: 'rice' },
  { label: 'Pocket Coins info', icon: 'coin' },
]
