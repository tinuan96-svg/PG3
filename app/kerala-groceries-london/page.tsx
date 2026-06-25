import CityLandingPage from '@/components/CityLandingPage'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kerala Groceries London | Next Day Delivery | PocketGrocery',
  description: 'Buy authentic Kerala groceries in London with next day delivery. Nirapara, Eastern, Double Horse and 1000+ products. Free delivery on orders over £40.',
  keywords: 'Kerala groceries London, Indian groceries London, Kerala spices London, buy Kerala groceries London, next day delivery London',
}

const cityData = {
  name: 'London',
  heroTitle: 'Kerala Groceries Delivered to London',
  heroSubtitle: 'Authentic Kerala products delivered to your London doorstep. Order before 4 PM for guaranteed next day delivery across all London postcodes.',
  deliveryInfo: 'Next Day Delivery to All London Postcodes',
  popularAreas: ['East London', 'West London', 'North London', 'South London', 'Central London', 'Ilford', 'Tooting', 'Wembley', 'Croydon', 'Stratford', 'Hounslow', 'Harrow', 'Barking', 'Lewisham', 'Ealing'],
  faq: [
    { question: 'Do you deliver Kerala groceries to all London postcodes?', answer: 'Yes, we deliver to all London postcodes including East, West, North, South and Central London. Next day delivery is available on all orders placed before 4 PM.' },
    { question: 'How much does delivery cost in London?', answer: 'Delivery is free on orders over £40 anywhere in London. For orders under £40, a flat rate of £4.99 applies.' },
    { question: 'What Kerala grocery brands are available in London?', answer: 'We stock all major Kerala brands including Nirapara, Eastern, Double Horse, Brahmins, Kitchen Treasures, 777, and many more with over 1000 products available.' },
    { question: 'Can I get same day delivery in London?', answer: 'Currently we offer next day delivery for orders placed before 4 PM. Same day delivery for select London postcodes is coming soon.' },
  ],
}

export default function KeralaGroceriesLondon() {
  return <CityLandingPage city={cityData} />
}
