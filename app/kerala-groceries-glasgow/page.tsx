import CityLandingPage from '@/components/CityLandingPage'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kerala Groceries Glasgow | Next Day Delivery | PocketGrocery',
  description: 'Buy authentic Kerala groceries in Glasgow with next day delivery. Nirapara, Eastern, Double Horse and 1000+ products. Free delivery on orders over £40.',
  keywords: 'Kerala groceries Glasgow, Indian groceries Glasgow, Kerala spices Glasgow, buy Kerala groceries Glasgow',
}

const cityData = {
  name: 'Glasgow',
  heroTitle: 'Kerala Groceries Delivered to Glasgow',
  heroSubtitle: 'Authentic Kerala products delivered to your Glasgow doorstep. Order before 4 PM for guaranteed next day delivery across Scotland.',
  deliveryInfo: 'Next Day Delivery Across Glasgow',
  popularAreas: ['Glasgow City Centre', 'Govanhill', 'Pollokshields', 'Partick', 'Shawlands', 'Maryhill', 'Springburn', 'Dennistoun', 'Hillhead', 'Kelvinside'],
  faq: [
    { question: 'Do you deliver Kerala groceries to Glasgow?', answer: 'Yes, we deliver to all Glasgow postcodes with next day delivery for orders placed before 4 PM.' },
    { question: 'What is the delivery cost to Glasgow?', answer: 'Delivery is free on orders over £40. For orders under £40, a flat delivery charge of £4.99 applies.' },
    { question: 'Which Kerala brands do you deliver to Glasgow?', answer: 'We deliver all major Kerala brands including Nirapara, Eastern, Double Horse, Brahmins, Kitchen Treasures, and 777.' },
  ],
}

export default function KeralaGroceriesGlasgow() {
  return <CityLandingPage city={cityData} />
}
