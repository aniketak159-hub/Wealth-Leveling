import { Link } from "wouter";
import { FileText, AlertTriangle } from "lucide-react";

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-12">
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-primary/20">
        <span className="text-primary/40 font-mono text-xs tracking-widest shrink-0">//</span>
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

export default function TermsPage() {
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
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <span className="font-mono text-xs tracking-widest text-primary/50 uppercase">
              Legal Document // Terms of Use
            </span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-widest text-foreground mb-4 uppercase">
            Terms of Service
          </h1>
          <div className="flex flex-wrap gap-6 font-mono text-xs text-primary/50 tracking-wider">
            <span>Effective: {effectiveDate}</span>
            <span>Jurisdiction: India</span>
          </div>
        </div>

        {/* Critical disclaimer — above everything else */}
        <div className="border border-amber-400/40 bg-amber-400/5 p-6 mb-12">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-heading text-sm font-bold tracking-widest text-amber-400 uppercase mb-2">
                Not Financial Advice
              </p>
              <p className="text-sm leading-7 text-foreground/80">
                Wealth Leveling is a <strong className="text-foreground">personal data tracking tool</strong>, not a
                financial advisory service. We are not registered with SEBI as an Investment Adviser
                under the SEBI (Investment Advisers) Regulations, 2013. Nothing on this platform —
                including quest suggestions, skill tree recommendations, stat allocations, or any
                computed metric — constitutes investment advice, financial planning advice, tax advice,
                or any other regulated financial service. All decisions about your money are yours alone.
                Consult a SEBI-registered adviser for personalised financial guidance.
              </p>
            </div>
          </div>
        </div>

        <Section id="service" title="01 — The Service">
          <P>
            Wealth Leveling ("Service", "we", "us") provides a gamified personal finance tracking
            application. You input your own financial data — net worth, income, expenses, assets,
            goals — and the Service displays it back to you in an RPG-style interface with quests,
            XP, levels, and skill trees.
          </P>
          <P>
            The Service does not connect to any bank, brokerage, or financial institution. All data
            is entered manually by you. The computed metrics (XP, rank, level, stat scores) are
            gamification devices based on your inputs and carry no financial meaning beyond what you
            assign to them.
          </P>
          <P>
            By creating an account, you ("User", "Data Principal") agree to these Terms and our{" "}
            <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>, which
            is incorporated herein by reference.
          </P>
        </Section>

        <Section id="eligibility" title="02 — Eligibility">
          <UL
            items={[
              "You must be at least 18 years old to use this Service.",
              "You must be a resident of India or accessing the Service lawfully from your jurisdiction.",
              "You must have the legal capacity to enter into a binding agreement.",
              "One account per person. Creating multiple accounts to circumvent restrictions is prohibited.",
            ]}
          />
        </Section>

        <Section id="your-data" title="03 — Your Data, Your Responsibility">
          <P>
            You own the financial data you enter. We are merely the custodian. This means:
          </P>
          <UL
            items={[
              <><strong className="text-foreground">Accuracy is yours.</strong> We display what you input. If you enter incorrect figures, the platform will display incorrect figures. We take no responsibility for decisions made based on inaccurate self-reported data.</>,
              <><strong className="text-foreground">Completeness is yours.</strong> The platform cannot flag what it cannot see. Leaving out liabilities or income sources will skew your metrics.</>,
              <><strong className="text-foreground">Interpretation is yours.</strong> A high XP score or high "rank" has no meaning outside this app. It does not represent financial health, creditworthiness, or investment readiness.</>,
              <><strong className="text-foreground">Export your data.</strong> We recommend periodically exporting records you cannot afford to lose. Account deletion is permanent.</>,
            ]}
          />
        </Section>

        <Section id="account" title="04 — Account Security">
          <UL
            items={[
              "Keep your credentials confidential. You are responsible for all activity under your account.",
              "Notify us immediately at privacy@wealthleveling.in if you suspect unauthorised access.",
              "Do not share your account with others. Each person should create their own account.",
              "We may suspend an account we reasonably believe has been compromised, and will notify you by email.",
            ]}
          />
        </Section>

        <Section id="prohibited" title="05 — Prohibited Uses">
          <P>You must not use the Service to:</P>
          <UL
            items={[
              "Enter financial data belonging to another person without their explicit consent.",
              "Attempt to reverse-engineer, scrape, or copy the platform's code or data.",
              "Probe, scan, or test the security of the platform.",
              "Introduce malware, bots, or automated scripts.",
              "Impersonate another user or person.",
              "Use the platform for any commercial purpose (e.g. reselling access, running a financial advisory practice on our infrastructure) without our written consent.",
              "Circumvent any access controls or authentication mechanisms.",
            ]}
          />
          <P>
            Violation of these prohibitions may result in immediate account termination and, where
            applicable, referral to law enforcement under the Information Technology Act, 2000 and
            DPDP Act 2023.
          </P>
        </Section>

        <Section id="intellectual-property" title="06 — Intellectual Property">
          <P>
            The Service, its design, code, graphics, copy, and the gamification system (quest framework,
            skill tree structure, rank system) are owned by Wealth Leveling and protected under Indian
            copyright law. These Terms grant you a limited, personal, non-transferable licence to use
            the Service. Nothing here transfers ownership of any Service IP to you.
          </P>
          <P>
            Your financial data remains yours. We claim no ownership over data you input.
          </P>
        </Section>

        <Section id="liability" title="07 — Disclaimer of Warranties & Limitation of Liability">
          <div className="hud-panel p-5 space-y-4">
            <p>
              <strong className="text-foreground uppercase tracking-wider font-mono text-xs">As-Is.</strong>{" "}
              The Service is provided "as is" without any warranty of fitness for a particular purpose,
              accuracy, or uninterrupted availability.
            </p>
            <p>
              <strong className="text-foreground uppercase tracking-wider font-mono text-xs">No Financial Loss Liability.</strong>{" "}
              We are not liable for any financial loss, missed opportunity, tax liability, or investment
              outcome arising from your use of the Service or reliance on any data or metric it displays.
              You take sole responsibility for all financial decisions.
            </p>
            <p>
              <strong className="text-foreground uppercase tracking-wider font-mono text-xs">Cap on Liability.</strong>{" "}
              To the maximum extent permitted by Indian law, our total aggregate liability to you for any
              claim arising from these Terms or the Service shall not exceed ₹1,000 (one thousand Indian
              Rupees) or the amount you paid us in the 12 months preceding the claim, whichever is higher.
            </p>
            <p>
              <strong className="text-foreground uppercase tracking-wider font-mono text-xs">Data Loss.</strong>{" "}
              We maintain backups and take reasonable precautions, but we are not liable for permanent
              data loss caused by events beyond our reasonable control.
            </p>
          </div>
        </Section>

        <Section id="termination" title="08 — Termination">
          <P>
            <strong className="text-foreground">You</strong> may terminate your account at any time from
            within the app. Account deletion is permanent and triggers data erasure under our{" "}
            <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
          </P>
          <P>
            <strong className="text-foreground">We</strong> may suspend or terminate your account without
            notice if you violate these Terms, engage in conduct harmful to other users or the platform,
            or if we discontinue the Service. We will attempt to provide 30 days' notice before discontinuing
            the Service entirely, giving you time to export your data.
          </P>
        </Section>

        <Section id="governing-law" title="09 — Governing Law & Disputes">
          <P>
            These Terms are governed by the laws of India. Any dispute arising from or relating to these
            Terms or the Service shall be subject to the exclusive jurisdiction of the courts of
            [City], India.
          </P>
          <P>
            Before initiating formal legal proceedings, you agree to first attempt resolution by contacting
            us at privacy@wealthleveling.in. We will make a genuine effort to resolve disputes within
            30 days.
          </P>
        </Section>

        <Section id="changes" title="10 — Changes to These Terms">
          <P>
            We may update these Terms to reflect changes in the law, new features, or operational needs.
            For material changes, we will notify you by email at least 14 days in advance. Continued use
            after the effective date constitutes acceptance. If you do not agree with the changes, you
            may terminate your account before they take effect.
          </P>
        </Section>

        <Section id="contact" title="11 — Contact">
          <div className="hud-panel p-5 font-mono text-xs tracking-wider space-y-2">
            <p className="text-primary/70 uppercase">Wealth Leveling — Legal & Grievances</p>
            <p>Email: <a href="mailto:privacy@wealthleveling.in" className="text-primary hover:underline">privacy@wealthleveling.in</a></p>
            <p className="text-primary/50 mt-2">Response time: 48 hours (acknowledgement) / 30 days (resolution)</p>
          </div>
        </Section>

        {/* Footer nav */}
        <div className="mt-16 pt-8 border-t border-primary/20 flex flex-wrap justify-between items-center gap-4 font-mono text-xs text-primary/40 tracking-widest">
          <span>WEALTH LEVELING // TERMS OF SERVICE</span>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-primary transition-colors uppercase">Privacy Policy</Link>
            <Link href="/" className="hover:text-primary transition-colors uppercase">Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
