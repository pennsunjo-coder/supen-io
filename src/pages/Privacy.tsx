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
        <p className="text-sm text-muted-foreground mb-12">Last updated: April 2026</p>

        <div className="space-y-10 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">1. Information We Collect</h2>
            <p className="mb-3">When you use Supen.io, we collect the following information:</p>
            <ul className="list-disc list-inside space-y-1.5 ml-2">
              <li><strong className="text-foreground">Account information</strong> — your email address and name, provided during sign-up or via Google OAuth.</li>
              <li><strong className="text-foreground">Content you generate</strong> — posts, infographics, and other content created through our platform.</li>
              <li><strong className="text-foreground">Research sources</strong> — PDFs, URLs, and notes you upload to your notebook.</li>
              <li><strong className="text-foreground">Usage data</strong> — platform preferences, generation history, and feature usage for improving the service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">2. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-1.5 ml-2">
              <li>To provide and maintain the Supen.io service, including content generation and AI chat.</li>
              <li>To personalize your experience based on your niche, platforms, and preferences.</li>
              <li>To improve our AI models and platform features through aggregated, anonymized usage patterns.</li>
              <li>To communicate with you about your account, updates, and support requests.</li>
            </ul>
            <p className="mt-4 font-medium text-foreground">We never sell your personal data to third parties.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">3. Data Storage & Security</h2>
            <ul className="list-disc list-inside space-y-1.5 ml-2">
              <li>All data is stored securely on <strong className="text-foreground">Supabase</strong> infrastructure with PostgreSQL databases.</li>
              <li>Data is encrypted at rest and in transit using industry-standard TLS encryption.</li>
              <li>Authentication is handled via Supabase Auth with Row Level Security (RLS) policies ensuring you can only access your own data.</li>
              <li>API keys are stored securely and never exposed in client-side code in production.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">4. Third-Party Services</h2>
            <p>We use the following third-party services to power Supen.io:</p>
            <ul className="list-disc list-inside space-y-1.5 ml-2 mt-3">
              <li><strong className="text-foreground">Anthropic (Claude)</strong> — for AI content generation and chat.</li>
              <li><strong className="text-foreground">Google Gemini</strong> — for image generation features.</li>
              <li><strong className="text-foreground">Tavily</strong> — for web search capabilities.</li>
              <li><strong className="text-foreground">Stripe</strong> — for payment processing (coming soon).</li>
            </ul>
            <p className="mt-3">Each service has its own privacy policy and handles data according to its terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">5. Your Rights</h2>
            <p className="mb-3">You have the right to:</p>
            <ul className="list-disc list-inside space-y-1.5 ml-2">
              <li><strong className="text-foreground">Access</strong> your data at any time through the Settings page.</li>
              <li><strong className="text-foreground">Export</strong> your generated content and research sources.</li>
              <li><strong className="text-foreground">Delete</strong> your account and all associated data permanently via Settings.</li>
              <li><strong className="text-foreground">Correct</strong> your personal information at any time.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">6. Contact</h2>
            <p>
              For any privacy-related questions or requests, contact us at{" "}
              <a href="mailto:privacy@supen.io" className="text-primary hover:underline">privacy@supen.io</a>.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
