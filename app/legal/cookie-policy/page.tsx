import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie Policy | PocketGrocery',
  description: 'Learn how PocketGrocery uses cookies to improve your shopping experience and comply with UK GDPR regulations.',
};

export default function CookiePolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8" style={{ color: '#0F2747' }}>Cookie Policy</h1>

      <div className="prose max-w-none">
        <p className="text-gray-600 mb-6">
          <strong>Last Updated:</strong> 13th March 2026
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>1. What Are Cookies</h2>
          <p className="text-gray-700 mb-4">
            Cookies are small text files that are placed on your device when you visit our website. They help us
            provide you with a better experience by remembering your preferences and understanding how you use our site.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>2. How We Use Cookies</h2>
          <p className="text-gray-700 mb-4">We use cookies for the following purposes:</p>

          <h3 className="text-xl font-semibold mb-3" style={{ color: '#5FAE9B' }}>Essential Cookies</h3>
          <p className="text-gray-700 mb-4">
            These cookies are necessary for the website to function and cannot be switched off. They enable core
            functionality such as:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>User authentication and account management</li>
            <li>Shopping cart functionality</li>
            <li>Security and fraud prevention</li>
            <li>Session management</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3" style={{ color: '#5FAE9B' }}>Performance Cookies</h3>
          <p className="text-gray-700 mb-4">
            These cookies collect information about how you use our website to help us improve performance:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Page load times and performance metrics</li>
            <li>Error tracking and debugging</li>
            <li>Site analytics and usage statistics</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3" style={{ color: '#5FAE9B' }}>Functional Cookies</h3>
          <p className="text-gray-700 mb-4">
            These cookies enhance your experience by remembering your choices:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Language and region preferences</li>
            <li>Product preferences and recently viewed items</li>
            <li>Display preferences</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3" style={{ color: '#5FAE9B' }}>Marketing Cookies</h3>
          <p className="text-gray-700 mb-4">
            With your consent, these cookies are used for:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Personalized product recommendations</li>
            <li>Targeted advertising</li>
            <li>Email marketing campaigns</li>
            <li>Social media integration</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>3. Third-Party Cookies</h2>
          <p className="text-gray-700 mb-4">
            We may use third-party services that set their own cookies, including:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li><strong>Google Analytics:</strong> For website analytics and performance tracking</li>
            <li><strong>Stripe:</strong> For secure payment processing</li>
            <li><strong>Social Media Platforms:</strong> For social sharing features</li>
          </ul>
          <p className="text-gray-700 mb-4">
            These third parties have their own privacy policies governing the use of cookies.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>4. Cookies We Use</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300 mb-4">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-4 py-2 text-left">Cookie Name</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Purpose</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Duration</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                <tr>
                  <td className="border border-gray-300 px-4 py-2">session_id</td>
                  <td className="border border-gray-300 px-4 py-2">Essential - maintains user session</td>
                  <td className="border border-gray-300 px-4 py-2">Session</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">cart_token</td>
                  <td className="border border-gray-300 px-4 py-2">Essential - shopping cart functionality</td>
                  <td className="border border-gray-300 px-4 py-2">30 days</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">auth_token</td>
                  <td className="border border-gray-300 px-4 py-2">Essential - user authentication</td>
                  <td className="border border-gray-300 px-4 py-2">7 days</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">cookie_consent</td>
                  <td className="border border-gray-300 px-4 py-2">Essential - stores cookie preferences</td>
                  <td className="border border-gray-300 px-4 py-2">1 year</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">_ga</td>
                  <td className="border border-gray-300 px-4 py-2">Analytics - Google Analytics tracking</td>
                  <td className="border border-gray-300 px-4 py-2">2 years</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>5. Managing Your Cookie Preferences</h2>
          <p className="text-gray-700 mb-4">
            You can control and manage cookies in several ways:
          </p>

          <h3 className="text-xl font-semibold mb-3" style={{ color: '#5FAE9B' }}>Cookie Banner</h3>
          <p className="text-gray-700 mb-4">
            When you first visit our website, you'll see a cookie consent banner. You can choose to accept all cookies,
            reject non-essential cookies, or customize your preferences.
          </p>

          <h3 className="text-xl font-semibold mb-3" style={{ color: '#5FAE9B' }}>Browser Settings</h3>
          <p className="text-gray-700 mb-4">
            Most browsers allow you to:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>View and delete cookies</li>
            <li>Block third-party cookies</li>
            <li>Block cookies from specific sites</li>
            <li>Block all cookies</li>
            <li>Delete all cookies when you close your browser</li>
          </ul>

          <p className="text-gray-700 mb-4">
            <strong>Note:</strong> Blocking or deleting cookies may affect your ability to use certain features of our website.
          </p>

          <h3 className="text-xl font-semibold mb-3" style={{ color: '#5FAE9B' }}>Browser-Specific Instructions</h3>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies and other site data</li>
            <li><strong>Firefox:</strong> Options → Privacy & Security → Cookies and Site Data</li>
            <li><strong>Safari:</strong> Preferences → Privacy → Cookies and website data</li>
            <li><strong>Edge:</strong> Settings → Privacy, search, and services → Cookies and site permissions</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>6. Impact of Disabling Cookies</h2>
          <p className="text-gray-700 mb-4">
            If you disable cookies, some features of our website may not function properly:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>You may need to log in each time you visit</li>
            <li>Shopping cart may not retain items</li>
            <li>Personalized recommendations may not be available</li>
            <li>Some pages may not display correctly</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>7. Updates to This Policy</h2>
          <p className="text-gray-700 mb-4">
            We may update this Cookie Policy from time to time to reflect changes in our practices or for legal reasons.
            The "Last Updated" date at the top of this page indicates when the policy was last revised.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>8. Contact Us</h2>
          <p className="text-gray-700 mb-4">
            If you have questions about our use of cookies, please contact us at:
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
