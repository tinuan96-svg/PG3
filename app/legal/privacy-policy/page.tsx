import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | PocketGrocery - Matha Grocers Ltd',
  description: 'Privacy Policy for PocketGrocery.com - Learn how Matha Grocers Ltd collects, uses, and protects your personal data in compliance with UK GDPR.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8" style={{ color: '#0F2747' }}>Privacy Policy</h1>

      <div className="prose max-w-none">
        <p className="text-gray-600 mb-6">
          <strong>Effective Date:</strong> 13th March 2026<br />
          <strong>Last Updated:</strong> 13th March 2026
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>1. Introduction</h2>
          <p className="text-gray-700 mb-4">
            Matha Grocers Ltd (trading as PocketGrocery) ("we", "us", "our") is committed to protecting your privacy.
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit
            our website pocketgrocery.com and use our services.
          </p>
          <p className="text-gray-700 mb-4">
            <strong>Company Details:</strong><br />
            Company Name: Matha Grocers Ltd<br />
            Company Number: 17063885<br />
            Registered Address: 52 Oldfields Road, Sutton, United Kingdom, SM1 2NU<br />
            Email: info@pocketgrocery.com<br />
            Phone: 079826003
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>2. Information We Collect</h2>

          <h3 className="text-xl font-semibold mb-3" style={{ color: '#5FAE9B' }}>2.1 Personal Information</h3>
          <p className="text-gray-700 mb-4">We collect personal information that you provide to us, including:</p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Name and contact details (email address, phone number, delivery address)</li>
            <li>Account credentials (username, password)</li>
            <li>Payment information (processed securely through Stripe)</li>
            <li>Order history and preferences</li>
            <li>Communication preferences</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3" style={{ color: '#5FAE9B' }}>2.2 Automatically Collected Information</h3>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>IP address and browser type</li>
            <li>Device information</li>
            <li>Cookies and usage data</li>
            <li>Location data (with your consent)</li>
            <li>Shopping behaviour and preferences</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>3. How We Use Your Information</h2>
          <p className="text-gray-700 mb-4">We use your information for:</p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Processing and fulfilling your orders</li>
            <li>Managing your Pocket Coin wallet and rewards</li>
            <li>Sending order confirmations and delivery updates</li>
            <li>Providing customer support</li>
            <li>Improving our website and services</li>
            <li>Sending marketing communications (with your consent)</li>
            <li>Complying with legal obligations</li>
            <li>Fraud prevention and security</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>4. Legal Basis for Processing (GDPR)</h2>
          <p className="text-gray-700 mb-4">We process your personal data under the following legal bases:</p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li><strong>Contract Performance:</strong> To fulfill orders and provide services</li>
            <li><strong>Legitimate Interests:</strong> To improve our services and prevent fraud</li>
            <li><strong>Legal Obligation:</strong> To comply with UK laws and regulations</li>
            <li><strong>Consent:</strong> For marketing communications and cookies (where required)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>5. Data Sharing and Disclosure</h2>
          <p className="text-gray-700 mb-4">We may share your information with:</p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li><strong>Service Providers:</strong> Payment processors (Stripe), delivery partners, hosting providers</li>
            <li><strong>Legal Requirements:</strong> Law enforcement or regulatory authorities when required</li>
            <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets</li>
          </ul>
          <p className="text-gray-700 mb-4">We do not sell your personal information to third parties.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>6. Cookies</h2>
          <p className="text-gray-700 mb-4">
            We use cookies and similar tracking technologies to enhance your experience. For detailed information,
            please see our <a href="/legal/cookie-policy" className="text-blue-600 hover:underline">Cookie Policy</a>.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>7. Your Rights (GDPR)</h2>
          <p className="text-gray-700 mb-4">Under UK GDPR, you have the right to:</p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li><strong>Access:</strong> Request a copy of your personal data</li>
            <li><strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
            <li><strong>Erasure:</strong> Request deletion of your data ("right to be forgotten")</li>
            <li><strong>Restriction:</strong> Limit how we use your data</li>
            <li><strong>Portability:</strong> Receive your data in a portable format</li>
            <li><strong>Object:</strong> Object to processing based on legitimate interests</li>
            <li><strong>Withdraw Consent:</strong> Withdraw consent at any time</li>
          </ul>
          <p className="text-gray-700 mb-4">
            To exercise these rights, contact us at info@pocketgrocery.com
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>8. Data Security</h2>
          <p className="text-gray-700 mb-4">
            We implement appropriate technical and organizational measures to protect your data, including encryption,
            secure servers, and access controls. However, no method of transmission over the internet is 100% secure.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>9. Data Retention</h2>
          <p className="text-gray-700 mb-4">
            We retain your personal data only for as long as necessary to fulfill the purposes outlined in this policy,
            comply with legal obligations, and resolve disputes. Order data is typically retained for 7 years to comply
            with tax and accounting requirements.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>10. International Transfers</h2>
          <p className="text-gray-700 mb-4">
            Your data is primarily stored in the UK/EU. If we transfer data outside the UK/EU, we ensure appropriate
            safeguards are in place in accordance with UK GDPR.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>11. Children's Privacy</h2>
          <p className="text-gray-700 mb-4">
            Our services are not intended for individuals under 18 years of age. We do not knowingly collect personal
            information from children.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>12. Changes to This Policy</h2>
          <p className="text-gray-700 mb-4">
            We may update this Privacy Policy from time to time. We will notify you of any material changes by posting
            the new policy on this page and updating the "Last Updated" date.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>13. Contact Us</h2>
          <p className="text-gray-700 mb-4">
            For questions about this Privacy Policy or to exercise your rights, contact us at:
          </p>
          <p className="text-gray-700 mb-4">
            <strong>Matha Grocers Ltd</strong><br />
            52 Oldfields Road, Sutton, United Kingdom, SM1 2NU<br />
            Email: info@pocketgrocery.com<br />
            Phone: 079826003
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>14. Complaints</h2>
          <p className="text-gray-700 mb-4">
            If you are not satisfied with our response, you have the right to lodge a complaint with the Information
            Commissioner's Office (ICO):<br />
            Website: <a href="https://ico.org.uk" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">https://ico.org.uk</a><br />
            Phone: 0303 123 1113
          </p>
        </section>
      </div>
    </div>
  );
}
