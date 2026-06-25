import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Disclaimer | PocketGrocery',
  description: 'Legal disclaimer for PocketGrocery.com - Matha Grocers Ltd',
};

export default function DisclaimerPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8" style={{ color: '#0F2747' }}>Disclaimer</h1>

      <div className="prose max-w-none">
        <p className="text-gray-600 mb-6">
          <strong>Last Updated:</strong> 13th March 2026
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>1. General Information</h2>
          <p className="text-gray-700 mb-4">
            The information provided on PocketGrocery.com is for general informational purposes only. While we strive
            to keep the information accurate and up-to-date, we make no representations or warranties of any kind,
            express or implied, about the completeness, accuracy, reliability, suitability, or availability of the
            website or the information, products, services, or related graphics contained on the website.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>2. Product Information</h2>
          <p className="text-gray-700 mb-4">
            Product descriptions, images, and specifications are provided for informational purposes. While we make
            every effort to ensure accuracy:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Product packaging and materials may contain different information than shown on our website</li>
            <li>Actual product colors may vary from images due to monitor settings</li>
            <li>Product availability and prices are subject to change without notice</li>
            <li>We reserve the right to correct any errors, inaccuracies, or omissions</li>
          </ul>
          <p className="text-gray-700 mb-4">
            Always read product labels, warnings, and directions before use. Do not rely solely on information
            presented on our website.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>3. Dietary and Allergen Information</h2>
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4">
            <p className="text-gray-800 font-semibold mb-2">Important Notice</p>
            <p className="text-gray-700">
              While we provide allergen information where available, we cannot guarantee that products are completely
              free from allergens due to manufacturing processes and cross-contamination risks.
            </p>
          </div>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Always check product packaging for the most current allergen information</li>
            <li>If you have food allergies or dietary restrictions, consult product labels carefully</li>
            <li>Contact manufacturers directly for detailed allergen information</li>
            <li>We are not responsible for adverse reactions to products purchased</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>4. Nutritional and Health Claims</h2>
          <p className="text-gray-700 mb-4">
            Any nutritional or health-related information provided on our website is for informational purposes only
            and should not be considered medical advice. We recommend:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Consulting with a qualified healthcare professional before making dietary changes</li>
            <li>Not relying on product descriptions as a substitute for professional medical advice</li>
            <li>Reading product labels for accurate nutritional information</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>5. Recipe and Cooking Information</h2>
          <p className="text-gray-700 mb-4">
            Recipes and cooking instructions provided on our website are for informational and entertainment purposes.
            We do not guarantee results and are not responsible for:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Cooking outcomes or recipe results</li>
            <li>Food safety issues arising from recipe preparation</li>
            <li>Allergic reactions to recipe ingredients</li>
            <li>Equipment or kitchen safety</li>
          </ul>
          <p className="text-gray-700 mb-4">
            Always follow proper food safety practices and adjust recipes for dietary needs and restrictions.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>6. External Links</h2>
          <p className="text-gray-700 mb-4">
            Our website may contain links to external websites operated by third parties. We have no control over the
            content, privacy policies, or practices of these websites and assume no responsibility for them. Linking
            to external sites does not imply endorsement.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>7. Availability and Stock</h2>
          <p className="text-gray-700 mb-4">
            While we make every effort to ensure product availability, we cannot guarantee that all products will be
            in stock. We reserve the right to:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Limit quantities purchased per customer</li>
            <li>Discontinue products without notice</li>
            <li>Substitute products when necessary</li>
            <li>Refuse or cancel orders</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>8. Pricing Errors</h2>
          <p className="text-gray-700 mb-4">
            We strive to provide accurate pricing information. However, errors may occur. If a product is listed at
            an incorrect price due to an error, we reserve the right to:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Refuse or cancel orders placed at the incorrect price</li>
            <li>Contact you for instructions before processing the order</li>
            <li>Offer you the product at the correct price</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>9. Pocket Coin Rewards</h2>
          <p className="text-gray-700 mb-4">
            Pocket Coins are a loyalty reward and have no cash value. We reserve the right to:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Modify or discontinue the Pocket Coin program at any time</li>
            <li>Change coin values and redemption rates</li>
            <li>Set expiry dates for coins</li>
            <li>Void coins earned through fraudulent activity</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>10. Limitation of Liability</h2>
          <p className="text-gray-700 mb-4">
            To the maximum extent permitted by law, Matha Grocers Ltd shall not be liable for any direct, indirect,
            incidental, special, consequential, or punitive damages resulting from:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Use or inability to use our website or products</li>
            <li>Errors or omissions in website content</li>
            <li>Unauthorized access to our systems</li>
            <li>Product availability or delivery delays</li>
            <li>Reliance on information provided on the website</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>11. Use at Your Own Risk</h2>
          <p className="text-gray-700 mb-4">
            Your use of PocketGrocery.com and any products purchased is at your own risk. We provide the website and
            services on an "as is" and "as available" basis without warranties of any kind.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>12. Changes to Website</h2>
          <p className="text-gray-700 mb-4">
            We reserve the right to modify, suspend, or discontinue any aspect of our website at any time without
            notice or liability.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>13. Professional Advice</h2>
          <p className="text-gray-700 mb-4">
            Nothing on this website constitutes professional advice (medical, legal, financial, or otherwise). Always
            consult appropriate professionals for specific advice related to your circumstances.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>14. Contact Information</h2>
          <p className="text-gray-700 mb-4">
            If you have questions about this disclaimer, please contact:
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
