import { Link } from "react-router-dom";
import { LogoFull } from "@/components/Logo";
import { ArrowLeft } from "lucide-react";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="h-14 border-b border-border/20 flex items-center px-6 max-w-3xl mx-auto">
        <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <LogoFull size="sm" />
        </Link>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-20">
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-12">Last updated: May 26, 2026</p>

        <div className="space-y-10 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">1. Agreement to Terms</h2>
            <p>
              These Terms of Service ("Terms") constitute a legally binding agreement between you and
              Supenli.ai ("we", "us", "our") governing your access to and use of the Supenli.ai website,
              applications, and services (collectively, the "Service"). By accessing or using the Service,
              you agree to be bound by these Terms. If you do not agree, you may not access or use the Service.
            </p>
            <p className="mt-3">
              We may modify these Terms at any time. Material changes will be communicated by email or
              in-app notice at least 14 days before taking effect. Continued use of the Service after
              changes take effect constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">2. Description of Service</h2>
            <p>
              Supenli.ai is an AI-powered content creation platform that helps creators generate
              platform-ready social media posts across LinkedIn, X, Instagram, TikTok, YouTube, and Facebook.
              The Service includes a research notebook, AI chat assistant, multi-platform content studio,
              infographic generation (Plus/Pro plans), and anti-AI humanization features.
            </p>
            <p className="mt-3">
              The Service is delivered "as a service" and may evolve over time. Features may be added,
              modified, or removed at our sole discretion. We will use reasonable efforts to notify users
              of material changes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">3. Eligibility & Accounts</h2>
            <ul className="list-disc list-inside space-y-1.5 ml-2">
              <li>You must be at least 16 years old to create an account.</li>
              <li>You must provide accurate, current, and complete information during registration.</li>
              <li>You are responsible for safeguarding your password and all activity under your account.</li>
              <li>You must notify us immediately at <a href="mailto:pennsunjo@gmail.com" className="text-primary hover:underline">pennsunjo@gmail.com</a> of any unauthorized use of your account.</li>
              <li>One person may not maintain more than one personal account.</li>
              <li>Accounts may not be transferred, sold, or shared with third parties.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">4. Subscription Plans & Billing</h2>
            <p className="mb-3">Supenli.ai offers the following plans:</p>
            <ul className="list-disc list-inside space-y-1.5 ml-2">
              <li><strong className="text-foreground">Plus — $10/month</strong> — 100 generations per month, 50 infographics per month, full feature access.</li>
              <li><strong className="text-foreground">Pro — $30/month</strong> — unlimited generations, 300 infographics per month, priority queue, early access to new features.</li>
            </ul>
            <p className="mt-4 mb-3">Billing terms:</p>
            <ul className="list-disc list-inside space-y-1.5 ml-2">
              <li>Paid subscriptions are billed monthly in advance via Stripe.</li>
              <li>You authorize us to charge your payment method on the recurring billing date until you cancel.</li>
              <li>You may cancel at any time from your account Settings. Cancellation takes effect at the end of the current billing period; you retain access until then.</li>
              <li>Refund requests are reviewed on a case-by-case basis and may be granted within 14 days of payment if the Service has not been substantially used.</li>
              <li>We may change pricing with at least 30 days notice to existing subscribers; the new price applies at the next renewal.</li>
              <li>Taxes are not included in displayed prices unless explicitly stated and are your responsibility where applicable.</li>
              <li>Failed payments may result in account suspension after a 7-day grace period.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">5. Acceptable Use</h2>
            <p className="mb-3">You agree not to use Supenli.ai to:</p>
            <ul className="list-disc list-inside space-y-1.5 ml-2">
              <li>Generate spam, misleading, fraudulent, or deceptive content.</li>
              <li>Impersonate any person, brand, or organization without authorization.</li>
              <li>Violate any applicable laws, regulations, or third-party rights (including intellectual property and privacy rights).</li>
              <li>Produce content that promotes violence, hate speech, harassment, sexual exploitation of minors, or illegal activities.</li>
              <li>Generate or distribute content designed to manipulate elections, undermine public health information, or spread disinformation.</li>
              <li>Attempt to reverse-engineer, decompile, scrape, or otherwise extract the source code or underlying models of the Service.</li>
              <li>Disrupt, overload, or circumvent any security, rate-limiting, or quota mechanism.</li>
              <li>Use the Service to build a competing product or to train competing AI models.</li>
              <li>Resell or sublicense access to the Service without our prior written consent.</li>
            </ul>
            <p className="mt-4 font-medium text-foreground">
              You are solely responsible for the content you generate, edit, and publish using Supenli.ai,
              including ensuring compliance with the terms of service of the platforms you publish to.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">6. Intellectual Property</h2>
            <ul className="list-disc list-inside space-y-1.5 ml-2">
              <li><strong className="text-foreground">Your content.</strong> You retain full ownership of all content you input into and generate from the Service. We do not claim rights over your generated posts, infographics, or outputs.</li>
              <li><strong className="text-foreground">License to operate.</strong> You grant us a limited, worldwide, non-exclusive, royalty-free license to process, store, and display your inputs and outputs solely for the purpose of operating and improving the Service for you.</li>
              <li><strong className="text-foreground">Our platform.</strong> Supenli.ai — including its software, design, brand, copy, and the orchestration of underlying AI models — is owned by Supenli.ai and protected by applicable intellectual property laws.</li>
              <li><strong className="text-foreground">Research sources.</strong> You represent and warrant that you have the right to upload and use any sources (PDFs, URLs, notes) you import into your notebook.</li>
              <li><strong className="text-foreground">Feedback.</strong> If you submit suggestions or feedback, you grant us a perpetual, royalty-free license to use them without restriction or compensation.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">7. AI-Generated Content Disclaimer</h2>
            <p>
              Supenli.ai produces content using third-party large language models (LLMs) and image-generation
              models. AI-generated outputs may contain inaccuracies, biases, or unintentional resemblances to
              existing works. You are responsible for reviewing, fact-checking, and editing all outputs before
              publication. We make no warranties regarding the accuracy, originality, suitability, or
              non-infringement of generated content.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">8. Service Availability</h2>
            <p>
              We strive for high availability but do not guarantee uninterrupted, error-free, or secure access
              to the Service. We may perform scheduled maintenance, deploy updates, or experience outages
              caused by third-party providers (e.g., AI model providers, hosting infrastructure) or other
              factors beyond our control. We are not liable for losses resulting from service interruptions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">9. Disclaimers</h2>
            <p>
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE", WITHOUT WARRANTIES OF ANY KIND, EXPRESS
              OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
              NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL MEET YOUR REQUIREMENTS, BE UNINTERRUPTED,
              TIMELY, SECURE, OR ERROR-FREE.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">10. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, SUPENLI.AI AND ITS AFFILIATES SHALL NOT BE LIABLE FOR
              ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS,
              REVENUES, DATA, OR GOODWILL, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE SERVICE.
              OUR AGGREGATE LIABILITY FOR ALL CLAIMS RELATED TO THE SERVICE IS LIMITED TO THE GREATER OF
              (A) THE AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM OR (B) $50 USD.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">11. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless Supenli.ai, its officers, employees, and
              affiliates from any claims, damages, liabilities, losses, and expenses (including reasonable
              attorneys' fees) arising out of or related to (a) your use of the Service, (b) content you
              generate, edit, or publish using the Service, or (c) your violation of these Terms or any
              applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">12. Termination</h2>
            <p>
              We may suspend or terminate your account at any time, with or without notice, if you violate
              these Terms, abuse the Service, fail to pay, or for any other reason at our reasonable
              discretion. You may delete your account at any time from your Settings page. Upon termination,
              your data will be permanently deleted within 30 days, except where retention is required by law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">13. Governing Law & Disputes</h2>
            <p>
              These Terms are governed by the laws of France, without regard to conflict-of-laws principles.
              Any dispute arising out of or relating to these Terms or the Service shall be resolved through
              good-faith negotiation. If unresolved within 60 days, disputes shall be submitted to the
              exclusive jurisdiction of the courts of Paris, France, unless mandatory consumer protection
              laws in your jurisdiction provide otherwise.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">14. Severability & Entire Agreement</h2>
            <p>
              If any provision of these Terms is held invalid or unenforceable, the remaining provisions
              shall remain in full force and effect. These Terms, together with our Privacy Policy,
              constitute the entire agreement between you and Supenli.ai regarding the Service and
              supersede any prior agreements.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">15. Contact</h2>
            <p>
              For any questions about these Terms, please contact us at{" "}
              <a href="mailto:pennsunjo@gmail.com" className="text-primary hover:underline">pennsunjo@gmail.com</a>.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
