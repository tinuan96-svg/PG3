import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms and Conditions | PocketGrocery',
  description: 'Terms and Conditions for using PocketGrocery.com. Read our terms of service before placing an order.',
};

export default function TermsConditionsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8" style={{ color: '#0F2747' }}>Terms and Conditions</h1>

      <div className="prose max-w-none">
        <p className="text-gray-600 mb-6">
          <strong>Effective Date:</strong> 13th March 2026<br />
          <strong>Last Updated:</strong> 13th March 2026
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>1. Agreement to Terms</h2>
          <p className="text-gray-700 mb-4">
            By accessing and using PocketGrocery.com, you accept and agree to be bound by these Terms and Conditions.
            These terms apply to all users of the website, including browsers, customers, and contributors.
          </p>
          <p className="text-gray-700 mb-4">
            <strong>Company Information:</strong><br />
            Company Name: Matha Grocers Ltd<br />
            Company Number: 17063885<br />
            Registered Address: 52 Oldfields Road, Sutton, United Kingdom, SM1 2NU<br />
            Email: info@pocketgrocery.com<br />
            Phone: 079826003
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>2. Use of Website</h2>
          <p className="text-gray-700 mb-4">You agree to use this website only for lawful purposes and in accordance with these Terms. You agree not to:</p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Use the website in any way that violates UK laws or regulations</li>
            <li>Engage in fraudulent activities or impersonate others</li>
            <li>Transmit harmful code, viruses, or malware</li>
            <li>Attempt to gain unauthorized access to our systems</li>
            <li>Use automated systems to scrape or extract data</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>3. Account Registration</h2>
          <p className="text-gray-700 mb-4">
            To place orders, you must create an account. You are responsible for maintaining the confidentiality of
            your account credentials and for all activities under your account. You must be at least 18 years old to
            create an account and place orders.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>4. Product Information and Pricing</h2>
          <p className="text-gray-700 mb-4">
            We strive to provide accurate product descriptions and pricing. However, we do not warrant that product
            descriptions, pricing, or other content is error-free. We reserve the right to correct errors and update
            information at any time without prior notice.
          </p>
          <p className="text-gray-700 mb-4">
            All prices are in British Pounds (GBP) and include VAT where applicable. Prices are subject to change without notice.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>5. Orders and Payment</h2>
          <p className="text-gray-700 mb-4">
            When you place an order, you make an offer to purchase products. We reserve the right to accept or decline
            your order for any reason. Your order is confirmed when we send you a confirmation email.
          </p>
          <p className="text-gray-700 mb-4">
            Payment must be made in full at the time of order. We accept payments through Stripe. By providing payment
            information, you represent that you are authorized to use the payment method.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>6. Delivery</h2>
          <p className="text-gray-700 mb-4">
            We offer next day delivery across the UK for orders placed before 4 PM. Delivery is subject to product
            availability and weather conditions.
          </p>
          <p className="text-gray-700 mb-4">
            <strong>Delivery Charges:</strong>
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Free delivery for orders above £40</li>
            <li>£4.99 delivery charge for orders under £40</li>
          </ul>
          <p className="text-gray-700 mb-4">
            Risk of loss passes to you upon delivery to your specified address. We are not responsible for delays
            caused by incorrect addresses or unavailable recipients.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>7. Returns and Refunds</h2>
          <p className="text-gray-700 mb-4">
            Please refer to our <a href="/legal/refund-policy" className="text-blue-600 hover:underline">Refund and Return Policy</a> for
            detailed information about returns, refunds, and damaged goods.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>8. Pocket Coin Wallet System</h2>
          <p className="text-gray-700 mb-4">
            Pocket Coins are a loyalty reward provided by PocketGrocery. Coins have no cash value and cannot be
            exchanged for cash. Coins are credited to your wallet after your order is marked as delivered.
          </p>
          <p className="text-gray-700 mb-4">
            We reserve the right to modify, suspend, or discontinue the Pocket Coin program at any time. Coins may
            expire according to our policies.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>9. Intellectual Property</h2>
          <p className="text-gray-700 mb-4">
            All content on this website, including text, graphics, logos, images, and software, is the property of
            Matha Grocers Ltd or its licensors and is protected by UK and international copyright laws.
          </p>
          <p className="text-gray-700 mb-4">
            You may not reproduce, distribute, modify, or create derivative works without our express written permission.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>10. Limitation of Liability</h2>
          <p className="text-gray-700 mb-4">
            To the fullest extent permitted by law, Matha Grocers Ltd shall not be liable for any indirect, incidental,
            special, consequential, or punitive damages arising from your use of the website or products purchased.
          </p>
          <p className="text-gray-700 mb-4">
            Our total liability shall not exceed the amount you paid for the relevant order.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>11. Indemnification</h2>
          <p className="text-gray-700 mb-4">
            You agree to indemnify and hold harmless Matha Grocers Ltd from any claims, damages, losses, liabilities,
            and expenses arising from your use of the website or violation of these Terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>12. Governing Law</h2>
          <p className="text-gray-700 mb-4">
            These Terms are governed by and construed in accordance with the laws of England and Wales. Any disputes
            shall be subject to the exclusive jurisdiction of the courts of England and Wales.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>13. Changes to Terms</h2>
          <p className="text-gray-700 mb-4">
            We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting.
            Your continued use of the website constitutes acceptance of the modified Terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>14. Severability</h2>
          <p className="text-gray-700 mb-4">
            If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall
            continue in full force and effect.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>15. Contact Information</h2>
          <p className="text-gray-700 mb-4">
            For questions about these Terms, please contact us at:
          </p>
          <p className="text-gray-700 mb-4">
            <strong>Matha Grocers Ltd</strong><br />
            52 Oldfields Road, Sutton, United Kingdom, SM1 2NU<br />
            Email: info@pocketgrocery.com<br />
            Phone: 079826003
          </p>
        </section>
      </div>
    </div>
  );
}
