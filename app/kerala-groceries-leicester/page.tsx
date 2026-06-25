import CityLandingPage from '@/components/CityLandingPage'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kerala Groceries Leicester | Next Day Delivery | PocketGrocery',
  description: 'Buy authentic Kerala groceries in Leicester with next day delivery. Nirapara, Eastern, Double Horse and 1000+ products. Free delivery on orders over £40.',
  keywords: 'Kerala groceries Leicester, Indian groceries Leicester, Kerala spices Leicester, buy Kerala groceries Leicester',
}

const cityData = {
  name: 'Leicester',
  heroTitle: 'Kerala Groceries Delivered to Leicester',
  heroSubtitle: 'Authentic Kerala products delivered to your Leicester doorstep. Order before 4 PM for guaranteed next day delivery.',
  deliveryInfo: 'Next Day Delivery Across Leicester',
  popularAreas: ['Leicester City Centre', 'Belgrave', 'Evington', 'Oadby', 'Wigston', 'Braunstone', 'Beaumont Leys', 'Rushey Mead', 'Highfields', 'Knighton'],
  faq: [
    { question: 'Do you deliver Kerala groceries to Leicester?', answer: 'Yes, we deliver to all Leicester postcodes with next day delivery for orders placed before 4 PM.' },
    { question: 'What is the delivery cost to Leicester?', answer: 'Delivery is free on orders over £40. For orders under £40, a flat delivery charge of £4.99 applies.' },
    { question: 'Which Kerala brands do you deliver to Leicester?', answer: 'We deliver all major Kerala brands including Nirapara, Eastern, Double Horse, Brahmins, Kitchen Treasures, and 777.' },
  ],
}

export default function KeralaGroceriesLeicester() {
  return <CityLandingPage city={cityData} />
}
