import type { Transaction } from "./types";

// ─── Category rules ──────────────────────────────────────────────────────────
// Order matters: first match wins. More specific patterns go first.

const RULES: Array<{ pattern: RegExp; label: string; skip?: boolean }> = [
  // ── Income (credits to skip from expense categorization)
  {
    pattern:
      /salary|sal |payroll|stipend|pay ?from|neft ?cr|wages|credited by|opening bal|od limit|interest earned|int\.?cr|dividend/i,
    label: "INCOME",
    skip: true,
  },

  // ── Transfers (skip — not real expenses)
  {
    pattern:
      /self transfer|to self|own account|between accounts|upi.{0,30}(to|by) .{0,40}@|neft|rtgs|imps|chq|cheque return|bounced/i,
    label: "Transfers",
    skip: true,
  },

  // ── Rent
  {
    pattern: /\brent\b|landlord|house.?owner|pg \b|paying.?guest|hostel fee/i,
    label: "Rent",
  },

  // ── Investments
  {
    pattern:
      /mutual.?fund|zerodha|groww|upstox|coin\.?zerodha|scripbox|paytm.?money|mirae|axis.?mf|hdfc.?mf|sbi.?mf|reliance.?mf|uti.?mf|nippon.?mf|lic.?mf|franklin.?templeton|nps\b|ppf\b|epfo|national.?pension|sip\b|elss\b|demat|share.?market|nse\b|bse\b|smallcase/i,
    label: "Investments",
  },

  // ── Insurance
  {
    pattern:
      /insurance|bajaj.?allianz|hdfc.?ergo|star.?health|niva.?bupa|icici.?lombard|tata.?aig|policy.?bazaar|new.?india.?assurance|oriental.?insurance|united.?india/i,
    label: "Insurance",
  },

  // ── EMI & Loans
  {
    pattern:
      /\bemi\b|loan.?repay|loan.?emi|credit.?card.?pay|cc.?pay|cc.?bill|card.?due|hdfc.?cc|icici.?cc|sbi.?card|axis.?cc|amex|citi.?card|kotak.?cc|yes.?cc|pay.?emi/i,
    label: "EMI & Loans",
  },

  // ── Food & Groceries
  {
    pattern:
      /swiggy|zomato|domino.?s|pizza.?hut|kfc\b|mcdonald|burger.?king|subway\b|blinkit|zepto\b|bigbasket|grofer|dmart\b|reliance.?fresh|natures.?basket|spencers?|easyday|more.?super|foodpanda|dunzo.*food|haldiram|amul\b|milkbasket|fresh.?to.?home|country.?delight|licious|eatfit|hunger.?box|box8|faasos|behrouz/i,
    label: "Food & Groceries",
  },

  // ── Transport
  {
    pattern:
      /\buber\b|\bola\b|\brapido\b|yulu\b|bounce\b|petrol|bpcl\b|iocl\b|hpcl\b|indian.?oil|bharat.?petroleum|hindustan.?petroleum|metro.?card|metro.?recharge|dmrc|irctc|makemytrip|ixigo|redbus|goibibo|cleartrip|abhibus|yatra\b|easemytrip|indigo\b|spicejet|airindia|vistara|akasa|bluedart|delhivery|ekart|xpressbees|dtdc|fedex|ups\b|dhl\b/i,
    label: "Transport",
  },

  // ── Utilities & Bills
  {
    pattern:
      /electricity|bescom|tata.?power|adani.?electric|bses\b|msedcl|mahadiscom|tneb|kseb|apepdcl|cesc\b|torrent.?power|water.?board|municipal|bbmp|piped.?gas|mahanagar.?gas|indraprastha.?gas|igl\b|mgl\b|gail.?gas|society.?maintenance|apartment.?maintenance|strata|housing.?society/i,
    label: "Utilities & Bills",
  },

  // ── Mobile & Internet (under Utilities)
  {
    pattern:
      /\bjio\b|\bairtel\b|vodafone|vi.?recharge|bsnl\b|mtnl\b|act.?fibernet|tikona|hathway|you.?broadband|den.?networks|recharge\b|talktime|mobile.?bill/i,
    label: "Utilities & Bills",
  },

  // ── Entertainment
  {
    pattern:
      /netflix|spotify|prime.?video|amazon.?prime|hotstar|disney\+?|youtube.?premium|zee5|sony.?liv|sunnxt|bookmyshow|pvr\b|inox\b|cinepolis|mxplayer|curiosity.?stream|apple.?one|apple.?music|apple.?tv/i,
    label: "Entertainment",
  },

  // ── Healthcare
  {
    pattern:
      /pharmacy|medplus|apollo.?pharm|wellness.?forever|frank.?ross|chemist|hospital|clinic|lab\b|diagnostic|pathology|practo|1mg\b|netmeds|tata.?health|cure.?fit|cult.?fit|manipal|fortis|narayana|max.?health|aster|lybrate/i,
    label: "Healthcare",
  },

  // ── Shopping
  {
    pattern:
      /amazon|flipkart|myntra|ajio\b|meesho|nykaa|tatacliq|tata.?cliq|reliance.?digital|croma\b|vijay.?sales|boat\b|samsung|apple.?store|mi.?store|oneplus|bata\b|woodland|decathlon|ikea|pepperfry|urban.?ladder|firstcry|babyoye|shopclues|snapdeal/i,
    label: "Shopping",
  },

  // ── Education
  {
    pattern:
      /coursera|udemy|unacademy|byju|vedantu|whitehat|toppr|skill.?share|linkedin.?learning|school.?fee|college.?fee|tuition|university|exam.?fee|cbse|upsc/i,
    label: "Education",
  },
];

// Categories that are budgeted (not just informational)
const EXPENSE_CATEGORIES = new Set([
  "Rent",
  "Investments",
  "Insurance",
  "EMI & Loans",
  "Food & Groceries",
  "Transport",
  "Utilities & Bills",
  "Entertainment",
  "Healthcare",
  "Shopping",
  "Education",
  "Other",
]);

// ─── Assign category to a transaction description ────────────────────────────
export function assignCategory(description: string): {
  label: string;
  skip: boolean;
} {
  for (const rule of RULES) {
    if (rule.pattern.test(description)) {
      return { label: rule.label, skip: rule.skip ?? false };
    }
  }
  return { label: "Other", skip: false };
}

// ─── Aggregate debits into budget items ─────────────────────────────────────
export function buildBudgetItems(
  transactions: Transaction[],
  monthlyIncome: number,
): { label: string; planned: number; actual: number }[] {
  const totals = new Map<string, number>();

  for (const tx of transactions) {
    if (tx.type !== "debit") continue;
    const { label, skip } = assignCategory(tx.description);
    if (skip) continue;
    totals.set(label, (totals.get(label) ?? 0) + tx.amount);
  }

  // Sort by amount descending so the biggest buckets show first
  return Array.from(totals.entries())
    .filter(([label]) => EXPENSE_CATEGORIES.has(label))
    .sort(([, a], [, b]) => b - a)
    .map(([label, actual]) => ({
      label,
      planned: Math.round(actual * 1.05), // 5% buffer as the planned estimate
      actual: Math.round(actual),
    }));
}

// ─── Detect investment assets from credit transactions ───────────────────────
export function detectInvestmentCredits(transactions: Transaction[]): Array<{
  label: string;
  amount: number;
  category: "STOCKS" | "MUTUAL_FUNDS" | "CRYPTO" | "OTHER";
}> {
  // Look for redemptions / sell transactions labelled as investments
  const investmentDebits = transactions.filter(
    (tx) =>
      tx.type === "debit" &&
      /mutual.?fund|zerodha|groww|upstox|smallcase|sip\b/i.test(tx.description),
  );

  if (investmentDebits.length === 0) return [];

  const mfTotal = investmentDebits
    .filter((tx) => /mutual.?fund|groww|sip\b|scripbox|coin/i.test(tx.description))
    .reduce((s, t) => s + t.amount, 0);

  const equityTotal = investmentDebits
    .filter((tx) => /zerodha|upstox|smallcase/i.test(tx.description))
    .reduce((s, t) => s + t.amount, 0);

  const result: ReturnType<typeof detectInvestmentCredits> = [];
  if (mfTotal > 0) result.push({ label: "Mutual Funds (SIP)", amount: mfTotal, category: "MUTUAL_FUNDS" });
  if (equityTotal > 0) result.push({ label: "Stocks / Equity", amount: equityTotal, category: "STOCKS" });
  return result;
}
