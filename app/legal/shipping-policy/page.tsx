import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shipping Policy | PocketGrocery - Next Day Delivery Across UK',
  description: 'PocketGrocery offers next day delivery across the UK. Free delivery on orders over £40. Order before 4 PM for next day delivery.',
};

export default function ShippingPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8" style={{ color: '#0F2747' }}>Shipping Policy</h1>

      <div className="prose max-w-none">
        <p className="text-gray-600 mb-6">
          <strong>Last Updated:</strong> 13th March 2026
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>1. Delivery Service</h2>
          <p className="text-gray-700 mb-4">
            PocketGrocery offers <strong>next day delivery across the United Kingdom</strong> for all orders placed
            before our daily cutoff time.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>2. Order Cutoff Time</h2>
          <div className="bg-blue-50 border-l-4 p-4 mb-4" style={{ borderColor: '#5FAE9B' }}>
            <p className="text-gray-800 font-semibold">
              Order before 4:00 PM (16:00 GMT) today for next day delivery
            </p>
          </div>
          <p className="text-gray-700 mb-4">
            Orders placed after 4:00 PM will be processed the following business day and delivered the day after.
          </p>
          <p className="text-gray-700 mb-4">
            <strong>Example:</strong><br />
            Order placed Monday at 3:00 PM → Delivered Tuesday<br />
            Order placed Monday at 5:00 PM → Delivered Wednesday
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>3. Delivery Charges</h2>
          <div className="bg-white border rounded-lg p-6 mb-4 shadow-sm">
            <div className="mb-4">
              <h3 className="text-xl font-semibold mb-2" style={{ color: '#5FAE9B' }}>Free Delivery</h3>
              <p className="text-gray-700">Orders <strong>£40 and above</strong> qualify for free next day delivery</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: '#5FAE9B' }}>Standard Delivery</h3>
              <p className="text-gray-700">Orders <strong>under £40</strong> incur a delivery charge of <strong>£4.99</strong></p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>4. Delivery Coverage</h2>
          <p className="text-gray-700 mb-4">
            We deliver to all UK mainland addresses including:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>England</li>
            <li>Scotland</li>
            <li>Wales</li>
            <li>Northern Ireland</li>
          </ul>
          <p className="text-gray-700 mb-4">
            <strong>Note:</strong> Some remote areas may experience delivery delays. We will notify you if your area
            is affected.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>5. Delivery Timeframes</h2>
          <p className="text-gray-700 mb-4">
            Deliveries are made Monday to Saturday between 8:00 AM and 8:00 PM. You will receive:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Order confirmation email immediately after placing your order</li>
            <li>Dispatch notification when your order is packed and ready for delivery</li>
            <li>Delivery notification on the day of delivery with an estimated time window</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>6. Delivery Address</h2>
          <p className="text-gray-700 mb-4">
            Please ensure your delivery address is accurate and complete. We cannot be held responsible for delays or
            non-delivery due to incorrect addresses.
          </p>
          <p className="text-gray-700 mb-4">
            If you need to change your delivery address after placing an order, please contact us immediately at
            info@pocketgrocery.com or call 079826003.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>7. Failed Deliveries</h2>
          <p className="text-gray-700 mb-4">
            If you are not available to receive your delivery:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Our driver will leave a card with instructions</li>
            <li>You can arrange redelivery by contacting us</li>
            <li>Orders may be left with a neighbor with your prior authorization</li>
            <li>Perishable items cannot be left unattended</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>8. Product Availability</h2>
          <p className="text-gray-700 mb-4">
            While we strive to maintain accurate stock levels, occasionally items may become unavailable. If an item
            in your order is out of stock:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>We will contact you to suggest suitable alternatives</li>
            <li>You can choose to accept the substitute or remove the item</li>
            <li>Refunds for unavailable items are processed immediately</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>9. Special Handling</h2>
          <p className="text-gray-700 mb-4">
            All our products, especially frozen and chilled items, are packed with care to maintain freshness:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Frozen items are packed with ice packs</li>
            <li>Chilled products are kept in insulated packaging</li>
            <li>Fragile items are carefully wrapped</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>10. Bank Holidays and Special Circumstances</h2>
          <p className="text-gray-700 mb-4">
            Delivery services may be affected during:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>UK bank holidays</li>
            <li>Severe weather conditions</li>
            <li>National emergencies</li>
          </ul>
          <p className="text-gray-700 mb-4">
            We will notify customers of any disruptions via email and website announcements.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>11. Order Tracking</h2>
          <p className="text-gray-700 mb-4">
            You can track your order status through:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Your account dashboard at pocketgrocery.com</li>
            <li>Email notifications</li>
            <li>Customer support at info@pocketgrocery.com</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>12. Damaged or Missing Items</h2>
          <p className="text-gray-700 mb-4">
            If your order arrives damaged or with missing items, please:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Take photos of the damaged packaging/items</li>
            <li>Contact us within 24 hours at info@pocketgrocery.com</li>
            <li>We will arrange a replacement or refund immediately</li>
          </ul>
          <p className="text-gray-700 mb-4">
            See our <a href="/legal/refund-policy" className="text-blue-600 hover:underline">Refund and Return Policy</a> for
            more information.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>13. Contact Us</h2>
          <p className="text-gray-700 mb-4">
            For delivery-related questions, please contact:
          </p>
          <p className="text-gray-700 mb-4">
            <strong>Matha Grocers Ltd</strong><br />
            Email: info@pocketgrocery.com<br />
            Phone: 079826003<br />
            Hours: Monday - Saturday, 9:00 AM - 6:00 PM
          </p>
        </section>
      </div>
    </div>
  );
}
