import { Link } from "react-router-dom";
import { LogoFull } from "@/components/Logo";
import { ArrowLeft } from "lucide-react";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="h-14 border-b border-border/20 flex items-center px-6 max-w-3xl mx-auto">
        <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <LogoFull size="sm" />
        </Link>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-20">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-12">Last updated: May 26, 2026</p>

        <div className="space-y-10 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">1. Introduction</h2>
            <p>
              Supenli.ai ("we", "us", "our") respects your privacy and is committed to protecting your
              personal data. This Privacy Policy explains how we collect, use, store, share, and protect
              your information when you use the Supenli.ai website, applications, and services (the "Service").
            </p>
            <p className="mt-3">
              This policy is designed to comply with the EU General Data Protection Regulation (GDPR)
              and the California Consumer Privacy Act (CCPA), among other applicable privacy laws.
              By using the Service, you agree to the practices described here.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">2. Data Controller</h2>
            <p>
              The data controller responsible for your personal data is Supenli.ai. For any privacy
              questions, requests, or to exercise your rights, contact us at{" "}
              <a href="mailto:pennsunjo@gmail.com" className="text-primary hover:underline">pennsunjo@gmail.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">3. Information We Collect</h2>
            <p className="mb-3">When you use Supenli.ai, we collect the following categories of information:</p>
            <ul className="list-disc list-inside space-y-1.5 ml-2">
              <li><strong className="text-foreground">Account information</strong> — email address, first name, password hash; or Google OAuth profile data (email, name, profile picture) if you sign in with Google.</li>
              <li><strong className="text-foreground">Profile data</strong> — niche, target platforms, content preferences, and onboarding answers you provide.</li>
              <li><strong className="text-foreground">Content you create</strong> — posts, scripts, infographic structures, and other content generated through the Studio.</li>
              <li><strong className="text-foreground">Research sources</strong> — PDFs, URLs, transcripts, and notes you upload to your notebook, including their extracted text.</li>
              <li><strong className="text-foreground">Coach conversations</strong> — messages exchanged with the in-app AI Coach.</li>
              <li><strong className="text-foreground">Usage data</strong> — feature usage, generation counts, plan/subscription status, login timestamps.</li>
              <li><strong className="text-foreground">Payment data</strong> — Stripe customer ID and subscription ID. Full payment card details are processed and stored by Stripe and never reach our servers.</li>
              <li><strong className="text-foreground">Technical data</strong> — IP address, browser type and version, device type, and basic diagnostics (collected via standard server and Supabase Auth logs).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">4. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-1.5 ml-2">
              <li>To provide, maintain, and operate the Service (content generation, AI chat, infographics).</li>
              <li>To personalize your experience based on your niche, platforms, style memory, and past content.</li>
              <li>To process subscriptions and payments via Stripe.</li>
              <li>To send transactional emails (account confirmation, password reset, subscription updates).</li>
              <li>To send re-engagement emails to inactive accounts (you can opt out at any time).</li>
              <li>To enforce plan quotas, rate limits, and security policies.</li>
              <li>To improve the Service through aggregated, anonymized usage analytics.</li>
              <li>To investigate and prevent abuse, fraud, and security incidents.</li>
              <li>To comply with legal obligations and respond to lawful requests.</li>
            </ul>
            <p className="mt-4 font-medium text-foreground">We never sell your personal data to third parties.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">5. Legal Bases for Processing (GDPR)</h2>
            <p className="mb-3">Where GDPR applies, we process your personal data on the following legal bases:</p>
            <ul className="list-disc list-inside space-y-1.5 ml-2">
              <li><strong className="text-foreground">Contract</strong> — processing necessary to deliver the Service you signed up for.</li>
              <li><strong className="text-foreground">Legitimate interest</strong> — to operate, secure, and improve the Service, prevent abuse, and send essential service communications.</li>
              <li><strong className="text-foreground">Consent</strong> — for optional marketing communications and any non-essential cookies. You may withdraw consent at any time.</li>
              <li><strong className="text-foreground">Legal obligation</strong> — to comply with tax, accounting, and regulatory requirements.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">6. Data Storage & Security</h2>
            <ul className="list-disc list-inside space-y-1.5 ml-2">
              <li>All data is stored on <strong className="text-foreground">Supabase</strong> infrastructure (PostgreSQL databases hosted in the EU — eu-west-1, Ireland).</li>
              <li>Data is encrypted at rest and in transit using industry-standard TLS encryption.</li>
              <li>Authentication is handled via Supabase Auth, with Row Level Security (RLS) policies ensuring you can only access your own data.</li>
              <li>API keys and secrets are stored in secure environment variables and are never exposed in client-side code.</li>
              <li>Administrative access to your data is restricted to a small number of authorized personnel and logged.</li>
              <li>We follow the principle of least privilege when granting internal access.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">7. Third-Party Services (Sub-Processors)</h2>
            <p className="mb-3">We use the following third-party processors to deliver the Service:</p>
            <ul className="list-disc list-inside space-y-1.5 ml-2">
              <li><strong className="text-foreground">Supabase</strong> — database, authentication, storage, edge functions (EU hosting).</li>
              <li><strong className="text-foreground">Vercel</strong> — frontend hosting and content delivery.</li>
              <li><strong className="text-foreground">OpenAI</strong> — text generation (GPT-4o).</li>
              <li><strong className="text-foreground">Anthropic (Claude)</strong> — text generation and PDF extraction.</li>
              <li><strong className="text-foreground">Google (Gemini)</strong> — infographic and image generation.</li>
              <li><strong className="text-foreground">Tavily</strong> — web search.</li>
              <li><strong className="text-foreground">Stripe</strong> — subscription billing and payment processing.</li>
              <li><strong className="text-foreground">Resend</strong> — transactional and broadcast email delivery.</li>
            </ul>
            <p className="mt-3">
              We share only the data each provider needs to perform its function. Inputs sent to AI providers
              (OpenAI, Anthropic, Google) are sent for generation purposes only; we do not authorize them to
              use your data to train their models. Each provider has its own privacy policy, and we ensure
              they meet appropriate data protection standards.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">8. International Data Transfers</h2>
            <p>
              Some of our sub-processors (notably OpenAI, Anthropic, Google, Stripe, Resend) are based in
              the United States or other jurisdictions outside the European Economic Area. Where data is
              transferred outside the EEA, we rely on appropriate safeguards such as Standard Contractual
              Clauses (SCCs) approved by the European Commission, or equivalent legal mechanisms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">9. Cookies & Tracking</h2>
            <p>
              We use essential cookies and similar technologies (such as localStorage and sessionStorage)
              required for the Service to function — for example, to keep you signed in and to remember
              your plan-selection intent during checkout. We do not use third-party advertising or
              behavioral-tracking cookies. We may add aggregated, privacy-preserving analytics in the
              future; if so, we will update this policy and ask for consent where required.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">10. Data Retention</h2>
            <ul className="list-disc list-inside space-y-1.5 ml-2">
              <li>Account and content data is retained for as long as your account is active.</li>
              <li>If you delete your account, all associated personal data is permanently deleted within 30 days, except where retention is required by law (e.g., accounting and tax records).</li>
              <li>Stripe billing records are retained for the duration required by applicable tax laws (typically 10 years in the EU).</li>
              <li>Server access logs and security logs are retained for up to 90 days.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">11. Your Rights</h2>
            <p className="mb-3">Subject to applicable law (GDPR, CCPA and others), you have the right to:</p>
            <ul className="list-disc list-inside space-y-1.5 ml-2">
              <li><strong className="text-foreground">Access</strong> — request a copy of the personal data we hold about you.</li>
              <li><strong className="text-foreground">Correction</strong> — update inaccurate or incomplete personal data, directly via your Settings or by contacting us.</li>
              <li><strong className="text-foreground">Deletion</strong> — delete your account and associated data at any time via Settings, or by emailing us.</li>
              <li><strong className="text-foreground">Portability</strong> — export your generated content and uploaded sources in a machine-readable format.</li>
              <li><strong className="text-foreground">Restriction or objection</strong> — restrict or object to certain processing activities.</li>
              <li><strong className="text-foreground">Withdraw consent</strong> — withdraw any consent you have given, at any time, without affecting prior lawful processing.</li>
              <li><strong className="text-foreground">Lodge a complaint</strong> — file a complaint with your local data protection authority (e.g., CNIL in France) if you believe your rights have been infringed.</li>
            </ul>
            <p className="mt-4">
              To exercise any of these rights, contact us at{" "}
              <a href="mailto:pennsunjo@gmail.com" className="text-primary hover:underline">pennsunjo@gmail.com</a>.
              We will respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">12. Children's Privacy</h2>
            <p>
              The Service is not intended for use by children under 16. We do not knowingly collect
              personal data from anyone under 16. If you believe a child has provided personal data to us,
              please contact us so we can promptly delete it.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">13. Marketing Communications</h2>
            <p>
              We may send you product updates, tips, and re-engagement emails. You can opt out at any time
              by clicking the "unsubscribe" link in any email, or by emailing us. Transactional emails
              (account, security, billing) cannot be unsubscribed while you maintain an active account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">14. Security Incidents</h2>
            <p>
              We take reasonable measures to protect personal data, but no method of transmission or
              storage is 100% secure. In the event of a personal data breach likely to result in a risk
              to your rights and freedoms, we will notify affected users and the relevant supervisory
              authority within 72 hours of becoming aware of the breach, as required by GDPR.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">15. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material changes
              by email or in-app notice at least 14 days before they take effect. The "Last updated" date
              at the top reflects the most recent revision.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">16. Contact</h2>
            <p>
              For any privacy-related questions or requests, contact us at{" "}
              <a href="mailto:pennsunjo@gmail.com" className="text-primary hover:underline">pennsunjo@gmail.com</a>.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
