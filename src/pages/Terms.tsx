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
        <p className="text-sm text-muted-foreground mb-12">Last updated: April 2026</p>

        <div className="space-y-10 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Supenli.ai, you agree to be bound by these Terms of Service.
              If you do not agree, you may not use the service. We may update these terms at any time,
              and continued use constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">2. Description of Service</h2>
            <p>
              Supenli.ai is an AI-powered content creation platform that helps creators generate
              platform-ready social media posts. The service includes a research notebook,
              AI chat assistant, content studio with multi-platform support, and anti-AI
              humanization features.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">3. User Accounts</h2>
            <ul className="list-disc list-inside space-y-1.5 ml-2">
              <li>You must provide accurate information when creating an account.</li>
              <li>You are responsible for maintaining the security of your account credentials.</li>
              <li>You must be at least 16 years old to use Supenli.ai.</li>
              <li>One person may not maintain more than one account.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">4. Acceptable Use</h2>
            <p className="mb-3">You agree not to use Supenli.ai to:</p>
            <ul className="list-disc list-inside space-y-1.5 ml-2">
              <li>Generate spam, misleading, or deceptive content.</li>
              <li>Impersonate other individuals or organizations.</li>
              <li>Violate any applicable laws or regulations.</li>
              <li>Generate content that promotes violence, hate speech, or illegal activities.</li>
              <li>Attempt to reverse-engineer, hack, or disrupt the service.</li>
            </ul>
            <p className="mt-4 font-medium text-foreground">
              You are solely responsible for the content you generate and publish using Supenli.ai.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">5. Intellectual Property</h2>
            <ul className="list-disc list-inside space-y-1.5 ml-2">
              <li><strong className="text-foreground">Your content</strong> — You retain full ownership of all content you generate using Supenli.ai. We claim no rights over your generated posts, infographics, or other outputs.</li>
              <li><strong className="text-foreground">Our platform</strong> — Supenli.ai, including its design, code, AI models integration, and branding, is owned by Supenli.ai and protected by intellectual property laws.</li>
              <li><strong className="text-foreground">Research sources</strong> — You are responsible for ensuring you have the right to use any sources you upload.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">6. Payment & Billing</h2>
            <ul className="list-disc list-inside space-y-1.5 ml-2">
              <li>Paid plans (Pro and Business) are billed monthly via Stripe.</li>
              <li>You can cancel your subscription at any time — access continues until the end of the billing period.</li>
              <li>Refunds are handled on a case-by-case basis within 14 days of purchase.</li>
              <li>Prices may change with 30 days notice to existing subscribers.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">7. Service Availability</h2>
            <p>
              We strive for 99.9% uptime but do not guarantee uninterrupted service.
              We may perform maintenance, updates, or experience outages beyond our control.
              We are not liable for any losses resulting from service interruptions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">8. Limitation of Liability</h2>
            <p>
              Supenli.ai is provided "as is" without warranties of any kind. To the maximum extent
              permitted by law, we are not liable for any indirect, incidental, or consequential
              damages arising from your use of the service. Our total liability is limited to
              the amount you paid us in the 12 months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">9. Termination</h2>
            <p>
              We may suspend or terminate your account if you violate these terms.
              You may delete your account at any time through the Settings page.
              Upon termination, your data will be permanently deleted within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">10. Contact</h2>
            <p>
              For questions about these terms, contact us at{" "}
              <a href="mailto:legal@supenli.ai" className="text-primary hover:underline">legal@supenli.ai</a>.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
