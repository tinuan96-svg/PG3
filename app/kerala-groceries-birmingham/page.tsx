import CityLandingPage from '@/components/CityLandingPage'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kerala Groceries Birmingham | Next Day Delivery | PocketGrocery',
  description: 'Buy authentic Kerala groceries in Birmingham with next day delivery. Nirapara, Eastern, Double Horse and 1000+ products. Free delivery on orders over £40.',
  keywords: 'Kerala groceries Birmingham, Indian groceries Birmingham, Kerala spices Birmingham, buy Kerala groceries Birmingham',
}

const cityData = {
  name: 'Birmingham',
  heroTitle: 'Kerala Groceries Delivered to Birmingham',
  heroSubtitle: 'Authentic Kerala products delivered to your Birmingham doorstep. Order before 4 PM for guaranteed next day delivery.',
  deliveryInfo: 'Next Day Delivery Across Birmingham',
  popularAreas: ['Birmingham City Centre', 'Sparkhill', 'Sparkbrook', 'Small Heath', 'Handsworth', 'Edgbaston', 'Moseley', 'Solihull', 'Sutton Coldfield', 'Erdington', 'Harborne'],
  faq: [
    { question: 'Do you deliver Kerala groceries to Birmingham?', answer: 'Yes, we deliver to all Birmingham postcodes and surrounding areas with next day delivery for orders placed before 4 PM.' },
    { question: 'What is the delivery cost to Birmingham?', answer: 'Delivery is free on orders over £40. For orders under £40, a flat delivery charge of £4.99 applies.' },
    { question: 'Which Kerala brands do you deliver to Birmingham?', answer: 'We deliver all major Kerala brands including Nirapara, Eastern, Double Horse, Brahmins, Kitchen Treasures, and 777.' },
  ],
}

export default function KeralaGroceriesBirmingham() {
  return <CityLandingPage city={cityData} />
}
