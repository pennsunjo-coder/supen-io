import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LogoFull } from "@/components/Logo";
import { ArrowLeft, Mail, Clock, Send, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    setSending(true);
    // Simulate send (replace with real endpoint later)
    await new Promise((r) => setTimeout(r, 800));
    setSending(false);
    setSent(true);
    toast.success("Message sent! We'll get back to you soon.");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="h-14 border-b border-border/20 flex items-center px-6 max-w-3xl mx-auto">
        <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <LogoFull size="sm" />
        </Link>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-20">
        <h1 className="text-3xl font-bold mb-2">Contact Us</h1>
        <p className="text-sm text-muted-foreground mb-12">We'd love to hear from you.</p>

        <div className="grid md:grid-cols-5 gap-10">
          {/* Form */}
          <div className="md:col-span-3">
            {sent ? (
              <div className="bg-card border border-border/20 rounded-xl p-8 text-center">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-lg font-bold mb-2">Message sent!</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Thanks for reaching out. We typically respond within 24 hours.
                </p>
                <Button variant="outline" size="sm" onClick={() => { setSent(false); setName(""); setEmail(""); setSubject(""); setMessage(""); }}>
                  Send another message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Name</label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      required
                      className="h-11"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email</label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="h-11"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Subject</label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="What's this about?"
                    className="h-11"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Message</label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us what's on your mind..."
                    required
                    className="min-h-[140px] resize-none"
                  />
                </div>
                <Button type="submit" className="h-11 gap-2" disabled={sending}>
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {sending ? "Sending..." : "Send message"}
                </Button>
              </form>
            )}
          </div>

          {/* Info sidebar */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-card border border-border/20 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <Mail className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold">Email</h3>
              </div>
              <a href="mailto:support@supenli.ai" className="text-sm text-primary hover:underline">
                support@supenli.ai
              </a>
            </div>

            <div className="bg-card border border-border/20 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold">Response time</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                We typically respond within 24 hours during business days.
              </p>
            </div>

            <div className="bg-card border border-border/20 rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-2">Quick links</h3>
              <ul className="space-y-1.5 text-sm">
                <li><Link to="/faq" className="text-muted-foreground hover:text-primary transition-colors">FAQ</Link></li>
                <li><Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
