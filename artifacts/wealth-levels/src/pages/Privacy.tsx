import { Link } from "wouter";
import { Shield } from "lucide-react";

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-12">
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-primary/20">
        <span className="text-primary/40 font-mono text-xs tracking-widest shrink-0">
          //
        </span>
        <h2 className="font-heading text-base sm:text-lg font-bold tracking-widest text-primary uppercase">
          {title}
        </h2>
      </div>
      <div className="space-y-4 text-sm leading-7 text-foreground/80">{children}</div>
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p>{children}</p>;
}

function UL({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="list-none space-y-2 pl-4 border-l border-primary/20">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2">
          <span className="text-primary/40 font-mono shrink-0">›</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function PrivacyPage() {
  const effectiveDate = "24 July 2025";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="w-full flex items-center justify-between px-4 sm:px-6 py-4 border-b border-primary/20 bg-background/50 backdrop-blur-md sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-3">
          <img src="/logo.svg" alt="Logo" className="w-8 h-8" />
          <span className="font-heading text-base sm:text-xl font-bold tracking-widest text-primary hud-glow">
            WEALTH LEVELING
          </span>
        </Link>
        <Link
          href="/"
          className="text-primary/60 hover:text-primary font-mono text-xs tracking-widest uppercase transition-colors"
        >
          ← Back
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-14">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 border border-primary/30 bg-primary/10">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <span className="font-mono text-xs tracking-widest text-primary/50 uppercase">
              Legal Document // Data Protection
            </span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-widest text-foreground mb-4 uppercase">
            Privacy Policy
          </h1>
          <div className="flex flex-wrap gap-6 font-mono text-xs text-primary/50 tracking-wider">
            <span>Effective: {effectiveDate}</span>
            <span>Jurisdiction: India</span>
            <span>Governing Law: DPDP Act 2023</span>
          </div>
        </div>

        {/* Preamble */}
        <div className="hud-panel p-6 mb-12 text-sm leading-7 text-foreground/80">
          <p>
            Wealth Leveling ("we", "us", "our") operates as a <strong className="text-foreground">Data Fiduciary</strong> under
            India's Digital Personal Data Protection Act, 2023 ("DPDP Act"). This Privacy Policy explains
            what personal data we collect, why we collect it, how we protect it, and what rights you hold
            as a Data Principal. By creating an account and entering your financial data, you give us your
            free, specific, informed, and unambiguous consent to process it as described here.
          </p>
          <p className="mt-3 text-primary/70 font-mono text-xs tracking-wider">
            If you do not agree, do not create an account or enter any data.
          </p>
        </div>

        <Section id="what-we-collect" title="01 — What We Collect">
          <P>We collect personal data in two categories:</P>
          <div className="space-y-5">
            <div>
              <p className="font-mono text-xs text-primary/70 tracking-widest uppercase mb-2">
                Identity & Authentication Data (via Clerk)
              </p>
              <UL
                items={[
                  "Email address — used to create and secure your account.",
                  "Name (if provided during sign-up).",
                  "Authentication credentials — managed and encrypted by Clerk, Inc. We never see your raw password.",
                  "Session metadata — timestamps and device signals used for security.",
                ]}
              />
            </div>
            <div>
              <p className="font-mono text-xs text-primary/70 tracking-widest uppercase mb-2">
                Financial Data (entered by you)
              </p>
              <UL
                items={[
                  "Net worth snapshots — assets, liabilities, and total wealth figures you record.",
                  "Income and expense entries — amounts, categories, and dates you input.",
                  "Quest and goal records — savings targets, deadlines, and completion status.",
                  "Asset inventory — cash, stocks, crypto, property, and other holdings you log.",
                  "Guild Hall builds — passive income sources and projected returns you define.",
                  "Skill tree progress — XP, level, and rank calculated from your activity.",
                  "Bank statement uploads (optional) — PDFs you choose to upload for auto-categorisation; processed in memory and not permanently stored.",
                ]}
              />
            </div>
          </div>
          <P>
            We do not collect data you have not entered. We do not scrape bank accounts, brokerage accounts,
            or any external financial service.
          </P>
        </Section>

        <Section id="why-we-collect" title="02 — Why We Collect It (Purpose)">
          <P>We process your personal data solely for the following purposes:</P>
          <UL
            items={[
              "Providing the service — rendering your dashboard, quests, skill tree, and wealth history.",
              "Account security — detecting suspicious logins and preventing unauthorised access.",
              "Product improvement — understanding aggregate usage patterns (anonymised, never individual financial data) to improve features.",
              "Legal compliance — responding to lawful requests from Indian courts or authorities under the DPDP Act.",
            ]}
          />
          <P>
            We will not use your financial data for advertising, credit scoring, insurance underwriting,
            employment profiling, or sale to third parties. Ever.
          </P>
        </Section>

        <Section id="legal-basis" title="03 — Legal Basis for Processing">
          <P>
            Under the DPDP Act 2023, we rely on your <strong className="text-foreground">explicit consent</strong> as
            the lawful basis for processing your personal and financial data. You grant this consent when you
            create an account. You may withdraw it at any time by deleting your account (see Section 07).
            Withdrawal of consent does not affect the lawfulness of processing prior to withdrawal.
          </P>
        </Section>

        <Section id="third-parties" title="04 — Third-Party Data Processors">
          <P>
            We engage the following Data Processors who access your data only to provide their contracted
            services:
          </P>
          <div className="space-y-4">
            <div className="hud-panel p-4">
              <p className="font-mono text-xs text-primary/70 tracking-widest uppercase mb-1">Clerk, Inc. — Authentication</p>
              <p>
                Stores your email address, hashed credentials, and session tokens. Clerk's servers may be
                located outside India. By using this service, you consent to this cross-border transfer.
                Clerk's privacy policy: <a href="https://clerk.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">clerk.com/privacy</a>
              </p>
            </div>
            <div className="hud-panel p-4">
              <p className="font-mono text-xs text-primary/70 tracking-widest uppercase mb-1">Replit, Inc. — Hosting & Infrastructure</p>
              <p>
                Hosts the application server and database on cloud infrastructure. Your data is stored
                in their managed PostgreSQL database. Replit's privacy policy:{" "}
                <a href="https://replit.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">replit.com/privacy</a>
              </p>
            </div>
          </div>
          <P>
            No other third party receives your personal or financial data. We do not use Google Analytics,
            Meta Pixel, or any advertising trackers.
          </P>
        </Section>

        <Section id="retention" title="05 — Data Retention">
          <UL
            items={[
              "Active account — data is retained for as long as your account exists.",
              "After deletion — we delete your personal and financial data within 30 days of account deletion, except where retention is required by Indian law.",
              "Anonymised aggregate data — usage statistics stripped of all identifying information may be retained indefinitely.",
              "Bank statement uploads — processed in memory during the session and not written to permanent storage.",
            ]}
          />
        </Section>

        <Section id="security" title="06 — Security Measures">
          <P>
            We implement the following technical and organisational measures to protect your data:
          </P>
          <UL
            items={[
              "Encryption in transit — all data is transmitted over TLS 1.2 or higher.",
              "Encryption at rest — database storage is encrypted by the hosting provider.",
              "Authentication security — passwords are never stored; Clerk manages hashed credentials.",
              "Access controls — only the application itself has database access; no human operator can browse your financial records directly.",
              "No third-party analytics — no tracking scripts that could leak your session to advertisers.",
            ]}
          />
          <P>
            No security system is impenetrable. In the event of a breach affecting your data, we will
            notify you by email within 72 hours of becoming aware of it, as required under applicable law.
          </P>
        </Section>

        <Section id="your-rights" title="07 — Your Rights Under the DPDP Act 2023">
          <P>
            As a Data Principal, you have the following rights. Exercise any of them by emailing our
            Grievance Officer (Section 09):
          </P>
          <div className="space-y-3">
            {[
              {
                right: "Right to Access (Section 11)",
                desc: "Request a summary of what personal data we hold about you and how it is being processed.",
              },
              {
                right: "Right to Correction & Erasure (Section 12)",
                desc: "Request correction of inaccurate data or erasure of data we no longer need to provide the service. You can also delete your own financial records directly within the app.",
              },
              {
                right: "Right to Grievance Redressal (Section 13)",
                desc: "Lodge a complaint with us. We will acknowledge within 48 hours and resolve within 30 days. If unsatisfied, you may escalate to the Data Protection Board of India.",
              },
              {
                right: "Right to Withdraw Consent",
                desc: "Withdraw your consent at any time by deleting your account. This does not affect prior processing.",
              },
              {
                right: "Right to Nominate (Section 14)",
                desc: "Nominate another person to exercise your rights in the event of your death or incapacity.",
              },
            ].map(({ right, desc }) => (
              <div key={right} className="hud-panel p-4">
                <p className="font-mono text-xs text-primary/80 tracking-wider uppercase mb-1">{right}</p>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section id="children" title="08 — Children's Privacy">
          <P>
            Wealth Leveling is not intended for persons under 18 years of age. We do not knowingly collect
            personal data from minors. If you believe a minor has created an account, contact our Grievance
            Officer and we will delete the account immediately.
          </P>
        </Section>

        <Section id="grievance" title="09 — Grievance Officer">
          <P>
            In accordance with Section 13 of the DPDP Act 2023, you may contact our Grievance Officer for
            any data protection concerns:
          </P>
          <div className="hud-panel p-5 font-mono text-xs tracking-wider space-y-2">
            <p className="text-primary/70 uppercase">Grievance Officer — Wealth Leveling</p>
            <p>Email: <a href="mailto:privacy@wealthleveling.in" className="text-primary hover:underline">privacy@wealthleveling.in</a></p>
            <p>Response time: 48 hours (acknowledgement) / 30 days (resolution)</p>
            <p className="text-primary/50 mt-3">
              Escalation: Data Protection Board of India — <a href="https://dpboard.gov.in" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">dpboard.gov.in</a>
            </p>
          </div>
        </Section>

        <Section id="changes" title="10 — Changes to This Policy">
          <P>
            If we make material changes to this policy — for example, adding a new data category or
            processor — we will notify you by email at least 7 days before the change takes effect and
            ask for fresh consent where required by the DPDP Act. Continued use after the effective date
            constitutes acceptance of non-material changes.
          </P>
        </Section>

        {/* Footer nav */}
        <div className="mt-16 pt-8 border-t border-primary/20 flex flex-wrap justify-between items-center gap-4 font-mono text-xs text-primary/40 tracking-widest">
          <span>WEALTH LEVELING // PRIVACY POLICY</span>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-primary transition-colors uppercase">Terms of Service</Link>
            <Link href="/" className="hover:text-primary transition-colors uppercase">Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
