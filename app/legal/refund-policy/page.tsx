import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund and Return Policy | PocketGrocery',
  description: '14-day return policy for non-perishable items. Immediate replacement for damaged goods. Learn about our refund and return process.',
};

export default function RefundPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8" style={{ color: '#0F2747' }}>Refund and Return Policy</h1>

      <div className="prose max-w-none">
        <p className="text-gray-600 mb-6">
          <strong>Last Updated:</strong> 13th March 2026
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>1. Our Commitment</h2>
          <p className="text-gray-700 mb-4">
            At PocketGrocery, customer satisfaction is our priority. We want you to be completely happy with your
            purchase. This policy outlines how we handle returns, refunds, and replacements.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>2. Damaged or Defective Goods</h2>
          <div className="bg-green-50 border-l-4 p-4 mb-4" style={{ borderColor: '#5FAE9B' }}>
            <p className="text-gray-800 font-semibold mb-2">Immediate Replacement Available</p>
            <p className="text-gray-700">
              If you receive damaged, defective, or incorrect items, we will replace them immediately at no cost to you.
            </p>
          </div>

          <h3 className="text-xl font-semibold mb-3" style={{ color: '#5FAE9B' }}>What to do:</h3>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Contact us within <strong>24 hours</strong> of delivery</li>
            <li>Provide your order number</li>
            <li>Take photos of the damaged items and packaging</li>
            <li>Email info@pocketgrocery.com or call 079826003</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3" style={{ color: '#5FAE9B' }}>We will:</h3>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Send a replacement item with your next delivery (or earlier if urgent)</li>
            <li>Issue a full refund if you prefer</li>
            <li>No need to return the damaged items</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>3. Return Window for Non-Perishable Items</h2>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
            <p className="text-gray-800 font-semibold">14-Day Return Policy</p>
            <p className="text-gray-700">
              You have <strong>14 days</strong> from the date of delivery to return eligible non-perishable items.
            </p>
          </div>

          <h3 className="text-xl font-semibold mb-3" style={{ color: '#5FAE9B' }}>Eligible for Return:</h3>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Packaged dry goods (unopened)</li>
            <li>Spices and seasonings (unopened)</li>
            <li>Canned and bottled products (unopened)</li>
            <li>Kitchen utensils and cookware</li>
            <li>Non-food items</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3" style={{ color: '#5FAE9B' }}>Return Conditions:</h3>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Items must be unopened and in original packaging</li>
            <li>Products must be in resaleable condition</li>
            <li>Must have proof of purchase (order number)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>4. Non-Returnable Items</h2>
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <p className="text-gray-800 font-semibold mb-2">No Returns for Frozen and Perishable Goods</p>
            <p className="text-gray-700">
              Due to health and safety regulations, we cannot accept returns on perishable items unless they are
              damaged or defective upon delivery.
            </p>
          </div>

          <h3 className="text-xl font-semibold mb-3" style={{ color: '#5FAE9B' }}>Non-returnable items include:</h3>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Frozen foods and frozen products</li>
            <li>Fresh vegetables and fruits</li>
            <li>Dairy products (milk, cheese, yogurt)</li>
            <li>Chilled and refrigerated items</li>
            <li>Meat and seafood</li>
            <li>Opened packages of any kind</li>
          </ul>

          <p className="text-gray-700 mb-4">
            <strong>Exception:</strong> If frozen or perishable goods arrive damaged, spoiled, or defective, contact us
            within 24 hours for an immediate replacement or refund.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>5. How to Request a Return</h2>
          <p className="text-gray-700 mb-4">To initiate a return:</p>

          <ol className="list-decimal pl-6 mb-4 text-gray-700 space-y-2">
            <li>Contact our customer support team at info@pocketgrocery.com or call 079826003</li>
            <li>Provide your order number and reason for return</li>
            <li>We will send you a return authorization and instructions</li>
            <li>Pack the items securely in original packaging</li>
            <li>Send the items to the return address provided</li>
          </ol>

          <p className="text-gray-700 mb-4">
            <strong>Return Shipping:</strong> For non-damaged items, return shipping costs are the responsibility of
            the customer unless the return is due to our error.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>6. Refund Process</h2>
          <p className="text-gray-700 mb-4">
            Once we receive and inspect your returned items, we will process your refund within <strong>5-7 business days</strong>.
          </p>

          <h3 className="text-xl font-semibold mb-3" style={{ color: '#5FAE9B' }}>Refund Methods:</h3>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li><strong>Original Payment Method:</strong> Refunds are issued to the original payment method used</li>
            <li><strong>Pocket Coins:</strong> You may opt to receive refund credit as Pocket Coins with a 10% bonus</li>
          </ul>

          <p className="text-gray-700 mb-4">
            <strong>Note:</strong> It may take an additional 5-10 business days for the refund to appear in your bank
            account depending on your bank's processing time.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>7. Exchanges</h2>
          <p className="text-gray-700 mb-4">
            We do not offer direct exchanges. If you need a different product:
          </p>
          <ol className="list-decimal pl-6 mb-4 text-gray-700 space-y-2">
            <li>Return the unwanted item following our return process</li>
            <li>Place a new order for the item you want</li>
          </ol>
          <p className="text-gray-700 mb-4">
            For damaged or incorrect items, we will send the correct replacement immediately.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>8. Cancellations</h2>
          <p className="text-gray-700 mb-4">
            You can cancel your order before it is dispatched for a full refund.
          </p>

          <h3 className="text-xl font-semibold mb-3" style={{ color: '#5FAE9B' }}>How to Cancel:</h3>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Contact us immediately at info@pocketgrocery.com or call 079826003</li>
            <li>Provide your order number</li>
            <li>If the order hasn't been dispatched, we will cancel and refund immediately</li>
          </ul>

          <p className="text-gray-700 mb-4">
            <strong>Note:</strong> Once an order is dispatched, you must follow the return process instead of cancellation.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>9. Wrong or Missing Items</h2>
          <p className="text-gray-700 mb-4">
            If your order contains wrong or missing items:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Contact us within 24 hours of delivery</li>
            <li>We will send the correct/missing items with your next delivery or arrange immediate dispatch</li>
            <li>No charge for the replacement</li>
            <li>Keep the incorrect items - no need to return</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>10. Quality Guarantee</h2>
          <p className="text-gray-700 mb-4">
            We guarantee the quality and freshness of all our products. If you are not satisfied with the quality of
            any item, contact us within 24 hours and we will provide a replacement or refund.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>11. Consumer Rights (UK)</h2>
          <p className="text-gray-700 mb-4">
            This policy does not affect your statutory rights under UK consumer protection law, including the Consumer
            Rights Act 2015. You have the right to:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Receive goods that match their description</li>
            <li>Receive goods of satisfactory quality</li>
            <li>Receive goods fit for purpose</li>
            <li>A refund, repair, or replacement for faulty goods</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>12. Contact Us</h2>
          <p className="text-gray-700 mb-4">
            For returns, refunds, or replacement queries, please contact:
          </p>
          <p className="text-gray-700 mb-4">
            <strong>Matha Grocers Ltd</strong><br />
            52 Oldfields Road, Sutton, United Kingdom, SM1 2NU<br />
            Email: info@pocketgrocery.com<br />
            Phone: 079826003<br />
            Hours: Monday - Saturday, 9:00 AM - 6:00 PM
          </p>
        </section>
      </div>
    </div>
  );
}
