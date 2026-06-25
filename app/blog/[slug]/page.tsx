import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'

const articles: Record<string, {
  title: string
  description: string
  image: string
  category: string
  readTime: string
  date: string
  content: string[]
  relatedProducts: { name: string; price: string; slug: string; image: string }[]
}> = {
  'how-to-make-perfect-kerala-sadya': {
    title: 'How to Make the Perfect Kerala Sadya at Home',
    description: 'A complete guide to preparing a traditional Kerala Sadya feast with all the essential dishes.',
    image: 'https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?auto=compress&cs=tinysrgb&w=800',
    category: 'Recipes',
    readTime: '12 min read',
    date: '10 March 2026',
    content: [
      'Kerala Sadya is one of the most elaborate and beloved feasts in Indian cuisine. Traditionally served on a banana leaf, a full Sadya can feature up to 26 different dishes, each with its own unique flavour profile.',
      'The key to a perfect Sadya lies in the balance of flavours - sweet, sour, salty, bitter, and spicy. Every dish complements the others, creating a harmonious meal that satisfies all the senses.',
      'Start with the basics: sambar, rasam, avial, olan, kalan, and pachadi. These form the core of any Sadya and are the dishes you should master first. Each requires fresh coconut, curry leaves, and mustard seeds.',
      'For the sambar, use a good quality sambar powder - we recommend Eastern or Brahmins brand for authentic taste. The vegetables should include drumstick, ash gourd, and raw banana.',
      'The payasam is the grand finale of any Sadya. A traditional Sadya features at least two types of payasam - ada pradhaman (made with rice flakes and jaggery) and palada payasam (made with rice ada and milk).',
    ],
    relatedProducts: [
      { name: 'Eastern Sambar Powder', price: '1.89', slug: 'eastern-sambar-powder', image: 'https://images.pexels.com/photos/2802527/pexels-photo-2802527.jpeg?auto=compress&cs=tinysrgb&w=300' },
      { name: 'Brahmins Payasam Mix', price: '2.49', slug: 'brahmins-payasam-mix', image: 'https://images.pexels.com/photos/4110257/pexels-photo-4110257.jpeg?auto=compress&cs=tinysrgb&w=300' },
      { name: 'Kerala Coconut Oil', price: '4.99', slug: 'kerala-coconut-oil-500ml', image: 'https://images.pexels.com/photos/725998/pexels-photo-725998.jpeg?auto=compress&cs=tinysrgb&w=300' },
    ],
  },
  'essential-kerala-spices-every-kitchen': {
    title: '10 Essential Kerala Spices Every Kitchen Needs',
    description: 'From black pepper to cardamom, discover the must-have Kerala spices for authentic cooking.',
    image: 'https://images.pexels.com/photos/2802527/pexels-photo-2802527.jpeg?auto=compress&cs=tinysrgb&w=800',
    category: 'Guides',
    readTime: '8 min read',
    date: '8 March 2026',
    content: [
      'Kerala is known as the spice garden of India, and for good reason. The state produces some of the finest spices in the world, which form the backbone of its rich culinary tradition.',
      'Black Pepper (Kurumulaku): Kerala produces some of the world\'s best black pepper. The Malabar variety is particularly prized for its sharp, pungent flavour. Essential for rasam, pepper chicken, and countless other dishes.',
      'Cardamom (Elaichi): The queen of spices, Kerala cardamom is used in everything from payasam to chai. Look for the green Elettaria variety for the best flavour.',
      'Turmeric (Manjal): Fresh Kerala turmeric has a deep, earthy flavour that commercial turmeric powder can\'t match. Used in almost every Kerala curry, it adds colour and anti-inflammatory benefits.',
      'Cinnamon, Cloves, Star Anise, Fennel Seeds, Fenugreek, Coriander, and Curry Leaves complete the essential Kerala spice rack. Each plays a vital role in creating the complex flavour layers that define Kerala cuisine.',
    ],
    relatedProducts: [
      { name: 'Eastern Turmeric Powder', price: '2.29', slug: 'eastern-turmeric-powder', image: 'https://images.pexels.com/photos/4198370/pexels-photo-4198370.jpeg?auto=compress&cs=tinysrgb&w=300' },
      { name: 'Eastern Garam Masala', price: '2.19', slug: 'eastern-garam-masala', image: 'https://images.pexels.com/photos/2802528/pexels-photo-2802528.jpeg?auto=compress&cs=tinysrgb&w=300' },
      { name: 'Melam Kashmiri Chilli', price: '3.49', slug: 'melam-kashmiri-chilli-powder', image: 'https://images.pexels.com/photos/2802526/pexels-photo-2802526.jpeg?auto=compress&cs=tinysrgb&w=300' },
    ],
  },
  'authentic-kerala-fish-curry-recipe': {
    title: 'Authentic Kerala Fish Curry (Meen Curry) Recipe',
    description: 'Step-by-step guide to making restaurant-quality Kerala fish curry at home.',
    image: 'https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg?auto=compress&cs=tinysrgb&w=800',
    category: 'Recipes',
    readTime: '10 min read',
    date: '5 March 2026',
    content: [
      'Kerala fish curry or Meen Curry is perhaps the most iconic dish from God\'s Own Country. This tangy, spicy curry made with fresh coconut and kokum is a staple in every Keralite household.',
      'The secret to a great fish curry lies in the coconut paste. Grind fresh grated coconut with shallots, garlic, and a small piece of raw mango or kokum for that signature tangy flavour.',
      'For the masala base, heat coconut oil and splutter mustard seeds, add sliced shallots, curry leaves, green chillies, and the ground coconut paste. Cook until the raw smell disappears.',
      'Add the fish curry powder (Brahmins or Eastern brands work perfectly), turmeric, and salt. Pour in thin coconut milk and bring to a gentle simmer before adding the fish pieces.',
      'The key is to never stir the fish once added - gently swirl the pan instead. This prevents the fish from breaking. Finish with thick coconut milk and fresh curry leaves.',
    ],
    relatedProducts: [
      { name: 'Brahmins Fish Curry Masala', price: '1.49', slug: 'brahmins-fish-curry-masala', image: 'https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg?auto=compress&cs=tinysrgb&w=300' },
      { name: 'Kerala Coconut Oil', price: '4.99', slug: 'kerala-coconut-oil-500ml', image: 'https://images.pexels.com/photos/725998/pexels-photo-725998.jpeg?auto=compress&cs=tinysrgb&w=300' },
    ],
  },
  'guide-to-kerala-rice-varieties': {
    title: 'A Complete Guide to Kerala Rice Varieties',
    description: 'Understand the different Kerala rice varieties, their uses, and nutritional benefits.',
    image: 'https://images.pexels.com/photos/4110255/pexels-photo-4110255.jpeg?auto=compress&cs=tinysrgb&w=800',
    category: 'Guides',
    readTime: '7 min read',
    date: '2 March 2026',
    content: [
      'Rice is the cornerstone of Kerala cuisine. Unlike the polished white rice common elsewhere, Kerala has a rich tradition of using parboiled and semi-polished rice varieties that retain more nutrients.',
      'Rose Matta Rice (Palakkadan Matta) is the most popular Kerala rice. This parboiled red rice has a distinctive earthy flavour and chewy texture. It is the traditional rice served with Kerala fish curry.',
      'Jeerakasala Rice is a fragrant, short-grain rice used primarily for biryanis and ghee rice. Its name comes from its resemblance to cumin seeds (jeera). It absorbs flavours beautifully.',
      'Surekha Rice is a long-grain variety used for everyday meals. It cooks up fluffy and separate, making it ideal for simple rice and curry meals.',
      'When buying Kerala rice, look for trusted brands like Nirapara, Double Horse, and Pavizham. Store rice in airtight containers to preserve freshness.',
    ],
    relatedProducts: [
      { name: 'Nirapara Rose Matta Rice 5kg', price: '8.99', slug: 'nirapara-rose-matta-rice-5kg', image: 'https://images.pexels.com/photos/4110252/pexels-photo-4110252.jpeg?auto=compress&cs=tinysrgb&w=300' },
      { name: 'Double Horse Jeerakasala Rice', price: '6.99', slug: 'double-horse-jeerakasala-rice', image: 'https://images.pexels.com/photos/4110254/pexels-photo-4110254.jpeg?auto=compress&cs=tinysrgb&w=300' },
    ],
  },
  'kerala-breakfast-recipes-puttu-appam': {
    title: 'Kerala Breakfast Recipes: Puttu, Appam & More',
    description: 'Traditional Kerala breakfast recipes including puttu, appam, idiyappam, and dosa.',
    image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800',
    category: 'Recipes',
    readTime: '15 min read',
    date: '28 February 2026',
    content: [
      'Kerala breakfasts are unlike anything else in India. The combination of steamed, fermented, and fried preparations with fresh coconut-based accompaniments makes for a truly unique morning meal.',
      'Puttu is perhaps the most iconic Kerala breakfast - cylinders of steamed rice flour layered with grated coconut. Use Nirapara or Double Horse puttu podi for the best results.',
      'Appam are lace-thin, bowl-shaped pancakes made from fermented rice batter with a soft, spongy centre. They pair perfectly with vegetable stew or egg curry.',
      'Idiyappam (string hoppers) are delicate nests of pressed rice noodles, steamed to perfection. Serve with coconut milk or a spicy curry for a light, satisfying meal.',
      'Dosa needs no introduction, but Kerala-style dosas are distinctively thinner and crispier. A good quality dosa podi mixed with water and left to ferment overnight gives the best results.',
    ],
    relatedProducts: [
      { name: 'Nirapara Chemba Puttu Podi', price: '2.99', slug: 'nirapara-chemba-puttu-podi', image: 'https://images.pexels.com/photos/4110251/pexels-photo-4110251.jpeg?auto=compress&cs=tinysrgb&w=300' },
      { name: 'Double Horse Appam Podi', price: '3.49', slug: 'double-horse-appam-podi', image: 'https://images.pexels.com/photos/4110255/pexels-photo-4110255.jpeg?auto=compress&cs=tinysrgb&w=300' },
      { name: 'Nirapara Idiyappam Podi', price: '3.29', slug: 'nirapara-idiyappam-podi', image: 'https://images.pexels.com/photos/4110253/pexels-photo-4110253.jpeg?auto=compress&cs=tinysrgb&w=300' },
    ],
  },
  'health-benefits-coconut-oil': {
    title: 'Health Benefits of Kerala Coconut Oil',
    description: 'Discover the science-backed health benefits of Kerala coconut oil.',
    image: 'https://images.pexels.com/photos/725998/pexels-photo-725998.jpeg?auto=compress&cs=tinysrgb&w=800',
    category: 'Health',
    readTime: '6 min read',
    date: '25 February 2026',
    content: [
      'Kerala coconut oil has been a staple in South Indian households for centuries. While it fell out of favour in the West during the low-fat era, modern research has vindicated many of its traditional uses.',
      'Rich in medium-chain triglycerides (MCTs), Kerala coconut oil is metabolised differently from other fats. MCTs are rapidly absorbed and converted to energy, making them less likely to be stored as body fat.',
      'The lauric acid in coconut oil has antimicrobial properties. Studies show it can help fight harmful bacteria, fungi, and viruses, supporting the immune system.',
      'For cooking, virgin coconut oil from Kerala has a high smoke point and adds a subtle sweetness to dishes. It is the traditional cooking oil for Kerala cuisine and contributes to the distinct flavour of dishes like avial and thoran.',
      'When shopping for Kerala coconut oil, look for cold-pressed or virgin varieties from brands like KPL Shudhi. These retain more of the natural nutrients and flavour compared to refined versions.',
    ],
    relatedProducts: [
      { name: 'Kerala Coconut Oil 500ml', price: '4.99', slug: 'kerala-coconut-oil-500ml', image: 'https://images.pexels.com/photos/725998/pexels-photo-725998.jpeg?auto=compress&cs=tinysrgb&w=300' },
    ],
  },
}

export async function generateStaticParams() {
  return Object.keys(articles).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const article = articles[params.slug]
  if (!article) return { title: 'Article Not Found | PocketGrocery' }
  return {
    title: `${article.title} | PocketGrocery Blog`,
    description: article.description,
  }
}

export default function BlogArticle({ params }: { params: { slug: string } }) {
  const article = articles[params.slug]

  if (!article) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2" style={{ color: '#0F2747' }}>Article Not Found</h1>
          <Link href="/blog" className="text-sm hover:underline" style={{ color: '#5FAE9B' }}>Back to Blog</Link>
        </div>
      </div>
    )
  }

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    image: article.image,
    datePublished: article.date,
    publisher: { '@type': 'Organization', name: 'PocketGrocery', url: 'https://pocketgrocery.com' },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />

      <article>
        <div className="relative h-64 md:h-80" style={{ backgroundColor: '#0F2747' }}>
          <Image src={article.image} alt={article.title} fill className="object-cover opacity-30" priority />
          <div className="absolute inset-0 flex items-center">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <span className="inline-block px-3 py-1 text-xs font-medium rounded-full text-white mb-4" style={{ backgroundColor: '#5FAE9B' }}>
                {article.category}
              </span>
              <h1 className="text-2xl md:text-4xl font-extrabold text-white mb-3">{article.title}</h1>
              <div className="flex items-center justify-center gap-4 text-sm text-gray-300">
                <span>{article.date}</span>
                <span>{article.readTime}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <nav className="text-sm text-gray-400 mb-8">
            <Link href="/" className="hover:text-gray-600">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/blog" className="hover:text-gray-600">Blog</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-600">{article.title}</span>
          </nav>

          <div className="prose prose-lg max-w-none">
            {article.content.map((paragraph, i) => (
              <p key={i} className="text-gray-700 leading-relaxed mb-5">{paragraph}</p>
            ))}
          </div>
        </div>

        {article.relatedProducts.length > 0 && (
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
            <h3 className="text-lg font-bold mb-4" style={{ color: '#0F2747' }}>Products Mentioned in This Article</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {article.relatedProducts.map((product) => (
                <Link key={product.slug} href={`/products/${product.slug}`} className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
                  <div className="relative aspect-square bg-gray-50">
                    <Image src={product.image} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 768px) 50vw, 33vw" />
                  </div>
                  <div className="p-3">
                    <h4 className="text-sm font-medium text-gray-800 line-clamp-2 mb-1">{product.name}</h4>
                    <p className="font-bold" style={{ color: '#0F2747' }}>£{product.price}</p>
                    <button className="mt-2 w-full py-1.5 rounded-lg text-white text-xs font-semibold" style={{ backgroundColor: '#5FAE9B' }}>
                      Add to Cart
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>

      <div className="bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Link href="/blog" className="inline-flex items-center gap-2 font-medium hover:opacity-75 transition-opacity" style={{ color: '#5FAE9B' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to All Articles
          </Link>
        </div>
      </div>
    </>
  )
}
