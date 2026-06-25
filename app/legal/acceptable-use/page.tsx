import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Acceptable Use Policy | PocketGrocery',
  description: 'Acceptable Use Policy for PocketGrocery.com - Rules and guidelines for using our website and services.',
};

export default function AcceptableUsePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8" style={{ color: '#0F2747' }}>Acceptable Use Policy</h1>

      <div className="prose max-w-none">
        <p className="text-gray-600 mb-6">
          <strong>Last Updated:</strong> 13th March 2026
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>1. Introduction</h2>
          <p className="text-gray-700 mb-4">
            This Acceptable Use Policy governs your use of PocketGrocery.com and related services provided by Matha
            Grocers Ltd. By using our website, you agree to comply with this policy.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>2. Permitted Use</h2>
          <p className="text-gray-700 mb-4">
            You may use our website for:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Browsing and purchasing Kerala grocery products</li>
            <li>Managing your account and orders</li>
            <li>Accessing recipes, blogs, and informational content</li>
            <li>Participating in loyalty programs (Pocket Coins)</li>
            <li>Contacting customer support</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>3. Prohibited Activities</h2>
          <p className="text-gray-700 mb-4">
            You must not use our website or services for any unlawful purpose or in any way that violates this policy.
            Prohibited activities include:
          </p>

          <h3 className="text-xl font-semibold mb-3" style={{ color: '#5FAE9B' }}>3.1 Fraudulent Activity</h3>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Using stolen credit cards or payment information</li>
            <li>Creating multiple accounts to abuse promotions or rewards</li>
            <li>Providing false information during registration or checkout</li>
            <li>Engaging in any form of payment fraud or chargebacks abuse</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3" style={{ color: '#5FAE9B' }}>3.2 Account Misuse</h3>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Sharing account credentials with others</li>
            <li>Creating accounts with false or misleading information</li>
            <li>Using someone else's account without permission</li>
            <li>Creating multiple accounts to circumvent restrictions</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3" style={{ color: '#5FAE9B' }}>3.3 System Abuse</h3>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Attempting to gain unauthorized access to our systems</li>
            <li>Using automated tools to scrape, crawl, or extract data</li>
            <li>Overloading our servers or disrupting service availability</li>
            <li>Reverse engineering or decompiling our software</li>
            <li>Probing, scanning, or testing system vulnerabilities</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3" style={{ color: '#5FAE9B' }}>3.4 Malicious Content</h3>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Uploading viruses, malware, or harmful code</li>
            <li>Distributing spam or unsolicited messages</li>
            <li>Phishing or social engineering attacks</li>
            <li>Injecting malicious scripts or code</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3" style={{ color: '#5FAE9B' }}>3.5 Intellectual Property Violations</h3>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Copying or reproducing website content without permission</li>
            <li>Using our trademarks, logos, or branding without authorization</li>
            <li>Infringing on copyrights or other intellectual property rights</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3" style={{ color: '#5FAE9B' }}>3.6 Harmful Behavior</h3>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Harassment or threatening behavior toward staff or customers</li>
            <li>Posting offensive, defamatory, or discriminatory content</li>
            <li>Impersonating others or misrepresenting affiliation</li>
            <li>Engaging in any illegal activity</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>4. Commercial Use Restrictions</h2>
          <p className="text-gray-700 mb-4">
            Unless explicitly authorized, you may not:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Resell products purchased from PocketGrocery for commercial purposes</li>
            <li>Use our website for bulk purchasing to resell elsewhere</li>
            <li>Extract product data for commercial competitive analysis</li>
            <li>Frame or embed our website content on other sites</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>5. User-Generated Content</h2>
          <p className="text-gray-700 mb-4">
            If you submit reviews, recipes, or other content to our website, you agree that:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Content must be original and not violate third-party rights</li>
            <li>Content must be truthful and not misleading</li>
            <li>Content must not contain offensive, harmful, or illegal material</li>
            <li>We may remove or modify content that violates this policy</li>
            <li>You grant us a license to use, display, and distribute the content</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>6. Referral Program Restrictions</h2>
          <p className="text-gray-700 mb-4">
            When participating in our referral program, you must not:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Create fake accounts to refer yourself</li>
            <li>Use spam or unsolicited methods to share referral links</li>
            <li>Misrepresent the referral program benefits</li>
            <li>Engage in fraudulent referral activities</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>7. Monitoring and Enforcement</h2>
          <p className="text-gray-700 mb-4">
            We reserve the right to:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Monitor website usage to ensure compliance with this policy</li>
            <li>Investigate suspected violations</li>
            <li>Remove or disable access to content that violates this policy</li>
            <li>Cooperate with law enforcement authorities</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>8. Consequences of Violation</h2>
          <p className="text-gray-700 mb-4">
            If you violate this Acceptable Use Policy, we may take the following actions:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Issue a warning</li>
            <li>Suspend or terminate your account</li>
            <li>Cancel pending orders</li>
            <li>Void Pocket Coins or rewards earned through violations</li>
            <li>Ban you from creating future accounts</li>
            <li>Report illegal activity to law enforcement</li>
            <li>Pursue legal action for damages</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>9. Reporting Violations</h2>
          <p className="text-gray-700 mb-4">
            If you become aware of any violations of this policy, please report them to:
          </p>
          <p className="text-gray-700 mb-4">
            Email: info@pocketgrocery.com<br />
            Subject: Acceptable Use Policy Violation Report
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>10. Security Responsibilities</h2>
          <p className="text-gray-700 mb-4">
            You are responsible for:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Maintaining the confidentiality of your account credentials</li>
            <li>Using strong, unique passwords</li>
            <li>Logging out after using shared devices</li>
            <li>Reporting unauthorized account access immediately</li>
            <li>Keeping your contact information up to date</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>11. Changes to This Policy</h2>
          <p className="text-gray-700 mb-4">
            We may update this Acceptable Use Policy at any time. Changes become effective immediately upon posting.
            Your continued use of the website constitutes acceptance of the updated policy.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>12. Governing Law</h2>
          <p className="text-gray-700 mb-4">
            This policy is governed by the laws of England and Wales. Violations may result in civil or criminal
            liability under applicable UK laws.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: '#0F2747' }}>13. Contact Information</h2>
          <p className="text-gray-700 mb-4">
            For questions about this Acceptable Use Policy, please contact:
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
