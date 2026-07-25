import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Lock,
  Server,
  KeyRound,
  Eye,
  Fingerprint,
  Globe,
  ArrowLeft,
  Database,
  Cpu,
} from "lucide-react";

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({
  icon: Icon,
  title,
  children,
  delay = 0,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="hud-panel p-6"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 border border-primary/40 bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <h2 className="font-heading text-sm tracking-[0.25em] text-primary uppercase">{title}</h2>
      </div>
      <div className="space-y-3 text-sm font-mono text-foreground/70 leading-relaxed">
        {children}
      </div>
    </motion.div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-primary/8 last:border-0">
      <span className="text-primary/40 text-[10px] tracking-widest uppercase w-36 shrink-0 pt-0.5">{label}</span>
      <span className="text-foreground/75 text-xs leading-snug">{value}</span>
    </div>
  );
}

export default function Security() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="w-full flex items-center justify-between px-4 sm:px-6 py-4 border-b border-primary/20 bg-background/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="Logo" className="w-8 h-8" />
          <span className="font-heading text-base sm:text-xl font-bold tracking-widest text-primary hud-glow">
            WEALTH LEVELING
          </span>
        </div>
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-mono tracking-widest text-primary/50 hover:text-primary transition-colors uppercase"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Home
        </Link>
      </nav>

      <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-16 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-primary/50 bg-primary/10 mb-6 hud-glow-box">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-heading font-bold tracking-widest mb-4">
            SECURITY &amp; DATA TRUST
          </h1>
          <p className="text-muted-foreground font-mono text-sm max-w-xl mx-auto leading-relaxed">
            You're entering real net-worth numbers, income, and savings data here. This page explains exactly
            where that data lives, how it's protected, and what we never do with it.
          </p>
        </motion.div>

        {/* Data architecture strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="border border-primary/20 bg-primary/3 px-5 py-4"
        >
          <div className="text-[10px] font-mono tracking-[0.3em] text-primary/40 uppercase mb-3">
            Data Flow Architecture
          </div>
          <div className="flex items-center gap-2 flex-wrap text-xs font-mono text-foreground/50">
            <span className="text-primary/80">Your browser</span>
            <span className="text-primary/30">──▶</span>
            <span className="border border-primary/20 px-2 py-0.5 text-[10px]">TLS (Replit proxy)</span>
            <span className="text-primary/30">──▶</span>
            <span className="border border-primary/20 px-2 py-0.5 text-[10px]">Express API</span>
            <span className="text-primary/30">──▶</span>
            <span className="border border-primary/20 px-2 py-0.5 text-[10px]">PostgreSQL (Replit managed)</span>
          </div>
          <p className="text-[10px] font-mono text-foreground/35 mt-3">
            No data leaves this chain. No analytics trackers. No ad networks. No third-party data sales.
          </p>
        </motion.div>

        {/* Sections */}
        <Section icon={Database} title="Where Your Data Lives" delay={0.2}>
          <Fact
            label="Database"
            value="Replit-managed PostgreSQL 16. Your account and all financial records are stored in an isolated container on Replit's infrastructure, not shared with other apps."
          />
          <Fact
            label="Encryption at rest"
            value="Replit's managed database volumes are encrypted at rest by the underlying cloud provider (AES-256). No additional application-layer encryption is applied — your numbers are stored as standard PostgreSQL numerics inside an encrypted volume."
          />
          <Fact
            label="Encryption in transit"
            value="All connections between your browser and the server are HTTPS-only. Replit's reverse proxy enforces TLS on every request; plain HTTP is rejected before it reaches the application."
          />
          <Fact
            label="Data location"
            value="Replit infrastructure runs on Google Cloud. Data is not deliberately replicated cross-region unless Replit does so as part of their managed service."
          />
          <Fact
            label="Backups"
            value="Replit maintains automated backups of managed databases. You can also export your data at any time from your profile."
          />
        </Section>

        <Section icon={Lock} title="Authentication Architecture" delay={0.25}>
          <Fact
            label="Identity provider"
            value="All accounts are managed by Clerk — an enterprise-grade auth platform (SOC 2 Type II). Clerk handles password hashing, session management, and email verification."
          />
          <Fact
            label="Passwords"
            value="Your password is never seen or stored by this app. Clerk handles credential storage using industry-standard hashing. We only receive a session token after successful Clerk authentication."
          />
          <Fact
            label="Sessions"
            value="Clerk session tokens are short-lived and scoped. Signing out immediately invalidates the session server-side — there is no 'stay signed in forever' risk."
          />
          <Fact
            label="Email verification"
            value="All new accounts require email verification before access is granted. Unverified accounts cannot log in."
          />
        </Section>

        <Section icon={KeyRound} title="PIN System" delay={0.3}>
          <Fact
            label="What it is"
            value="An optional 4–6 digit shortcut for re-authentication on devices you already trust. It does not replace your password — it's an additional credential layered on top of your Clerk account."
          />
          <Fact
            label="Storage"
            value="Your PIN is hashed with bcrypt (cost factor 12) before being stored. The raw PIN is never logged, stored, or transmitted after the moment of entry."
          />
          <Fact
            label="Two-factor option"
            value="You can enable TOTP (Time-based One-Time Password) as a second factor on PIN login. When enabled, a correct PIN plus a valid 6-digit code from your authenticator app are both required to complete login. Either alone is not enough."
          />
          <Fact
            label="Removal"
            value="You can remove your PIN at any time from the Profile page. Removal requires the current PIN to confirm."
          />
        </Section>

        <Section icon={Fingerprint} title="Two-Factor Authentication (TOTP)" delay={0.35}>
          <p>
            TOTP (RFC 6238) is the same standard used by Google Authenticator, Authy, and 1Password.
            When you enable it in your Profile, a secret key is generated and stored (encrypted) in
            the database. Your authenticator app uses this key to generate a fresh 6-digit code every
            30 seconds.
          </p>
          <p>
            To disable TOTP, you must supply a valid authenticator code — so even if someone has your
            password and PIN, they cannot remove the second factor without access to your authenticator device.
          </p>
          <div className="border border-primary/15 bg-primary/3 px-4 py-3 mt-2">
            <p className="text-[11px] text-primary/70">
              ▸ Enable 2-Step Verification from <Link href="/profile" className="underline underline-offset-2 hover:text-primary">Profile → Security</Link>
            </p>
          </div>
        </Section>

        <Section icon={Eye} title="What We Never Do" delay={0.4}>
          <Fact
            label="No data selling"
            value="Your financial data is never sold, licensed, or shared with advertisers, data brokers, or third parties for commercial purposes."
          />
          <Fact
            label="No analytics on content"
            value="We do not send your financial figures — net worth, income, transactions — to any analytics platform. Basic usage telemetry (page views) may be collected by Clerk; your financial data is not included."
          />
          <Fact
            label="No AI training"
            value="Your data is not used to train machine learning models, generate recommendations, or feed into any AI pipeline."
          />
          <Fact
            label="No financial advice"
            value="This app is a personal tracker, not an Investment Adviser. Nothing it shows you constitutes advice to buy, sell, or hold any financial product."
          />
        </Section>

        <Section icon={Globe} title="Your Rights (DPDP Act 2023)" delay={0.45}>
          <Fact
            label="Access (§11)"
            value="You can request a summary of all personal data we hold about you."
          />
          <Fact
            label="Correction (§12)"
            value="You can update your display name and other profile information from your Profile page."
          />
          <Fact
            label="Erasure (§13)"
            value="You can request complete deletion of your account and all associated data. Email us at privacy@wealthleveling.in — we will process the request within 30 days."
          />
          <Fact
            label="Grievance"
            value="To raise a data concern, contact our Grievance Officer at privacy@wealthleveling.in. We acknowledge grievances within 48 hours and resolve them within 30 days, as required by §13 of the DPDP Act 2023."
          />
          <Fact
            label="Consent withdrawal"
            value="You may withdraw consent for data processing at any time by deleting your account. Withdrawal does not affect the lawfulness of processing before withdrawal."
          />
        </Section>

        <Section icon={Cpu} title="Infrastructure Summary" delay={0.5}>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Database", value: "PostgreSQL 16" },
              { label: "Auth", value: "Clerk (SOC 2)" },
              { label: "Transport", value: "TLS / HTTPS" },
              { label: "PIN hashing", value: "bcrypt (12)" },
              { label: "2FA standard", value: "TOTP RFC 6238" },
              { label: "Hosting", value: "Replit / GCP" },
            ].map((item) => (
              <div key={item.label} className="border border-primary/10 bg-primary/3 px-3 py-2">
                <div className="text-[9px] tracking-[0.25em] text-primary/40 uppercase mb-1">{item.label}</div>
                <div className="text-xs text-foreground/70">{item.value}</div>
              </div>
            ))}
          </div>
        </Section>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="text-center pt-4"
        >
          <p className="text-[11px] font-mono text-foreground/30">
            Questions about this document? Email{" "}
            <a href="mailto:privacy@wealthleveling.in" className="text-primary/50 hover:text-primary underline underline-offset-2">
              privacy@wealthleveling.in
            </a>
          </p>
          <p className="text-[10px] font-mono text-foreground/20 mt-2">
            Last updated: July 2025 · Governed by Indian law
          </p>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-primary/20 py-8 bg-black/40">
        <div className="max-w-3xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-primary/50 text-xs font-mono tracking-widest">
            © {new Date().getFullYear()} WEALTH LEVELING // ENCRYPTED CONNECTION
          </p>
          <div className="flex items-center gap-6 text-xs font-mono tracking-widest">
            <Link href="/privacy" className="text-primary/40 hover:text-primary transition-colors uppercase">
              Privacy Policy
            </Link>
            <span className="text-primary/20">·</span>
            <Link href="/terms" className="text-primary/40 hover:text-primary transition-colors uppercase">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
