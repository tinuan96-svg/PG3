import CityLandingPage from '@/components/CityLandingPage'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kerala Groceries Manchester | Next Day Delivery | PocketGrocery',
  description: 'Buy authentic Kerala groceries in Manchester with next day delivery. Nirapara, Eastern, Double Horse and 1000+ products. Free delivery on orders over £40.',
  keywords: 'Kerala groceries Manchester, Indian groceries Manchester, Kerala spices Manchester, buy Kerala groceries Manchester',
}

const cityData = {
  name: 'Manchester',
  heroTitle: 'Kerala Groceries Delivered to Manchester',
  heroSubtitle: 'Authentic Kerala products delivered to your Manchester doorstep. Order before 4 PM for guaranteed next day delivery.',
  deliveryInfo: 'Next Day Delivery Across Manchester',
  popularAreas: ['Manchester City Centre', 'Longsight', 'Rusholme', 'Didsbury', 'Chorlton', 'Withington', 'Levenshulme', 'Fallowfield', 'Salford', 'Stretford', 'Oldham', 'Bolton', 'Stockport'],
  faq: [
    { question: 'Do you deliver Kerala groceries to Manchester?', answer: 'Yes, we deliver to all Manchester postcodes and the wider Greater Manchester area with next day delivery for orders placed before 4 PM.' },
    { question: 'What is the delivery cost to Manchester?', answer: 'Delivery is free on orders over £40. For orders under £40, a flat delivery charge of £4.99 applies.' },
    { question: 'Which Kerala brands do you deliver to Manchester?', answer: 'We deliver all major Kerala brands including Nirapara, Eastern, Double Horse, Brahmins, Kitchen Treasures, and 777 with over 1000 products.' },
  ],
}

export default function KeralaGroceriesManchester() {
  return <CityLandingPage city={cityData} />
}
