// PDF text extraction for bank statements.
// Best-effort: PDFs with tabular layout lose column alignment on text
// extraction, so we use regex patterns to find transaction-like lines.

import type { Transaction } from "./types";

// Amount pattern: optional comma-separated numbers, possibly with Dr/Cr suffix
const AMOUNT_RE = /[\d,]+\.\d{2}/g;

// Date patterns covering common Indian bank formats
const DATE_RE =
  /\b(\d{2}[-/]\d{2}[-/]\d{2,4}|\d{2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4})\b/i;

const MONTH_MAP: Record<string, string> = {
  jan: "01", feb: "02", mar: "03", apr: "04",
  may: "05", jun: "06", jul: "07", aug: "08",
  sep: "09", oct: "10", nov: "11", dec: "12",
};

function normaliseDate(raw: string): string {
  raw = raw.trim();
  // DD MMM YYYY
  const wordy = raw.match(/^(\d{2})\s+(\w{3})\s+(\d{4})$/i);
  if (wordy) {
    const [, d, mon, y] = wordy;
    const m = MONTH_MAP[mon.toLowerCase()] ?? "01";
    return `${y}-${m}-${d}`;
  }
  // DD/MM/YY or DD-MM-YYYY
  const parts = raw.split(/[-/]/);
  if (parts.length === 3) {
    const [d, m, y] = parts;
    const year = y.length === 2 ? `20${y}` : y;
    return `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return raw;
}

export function extractBankName(text: string): string {
  if (/hdfc\s+bank/i.test(text)) return "HDFC Bank";
  if (/icici\s+bank/i.test(text)) return "ICICI Bank";
  if (/state\s+bank\s+of\s+india|sbi\b/i.test(text)) return "SBI";
  if (/axis\s+bank/i.test(text)) return "Axis Bank";
  if (/kotak\s+(mahindra\s+)?bank/i.test(text)) return "Kotak Mahindra Bank";
  if (/yes\s+bank/i.test(text)) return "Yes Bank";
  if (/indusind\s+bank/i.test(text)) return "IndusInd Bank";
  if (/punjab\s+national\s+bank|pnb\b/i.test(text)) return "PNB";
  if (/bank\s+of\s+baroda/i.test(text)) return "Bank of Baroda";
  if (/canara\s+bank/i.test(text)) return "Canara Bank";
  if (/federal\s+bank/i.test(text)) return "Federal Bank";
  if (/idfc\s+(first\s+)?bank/i.test(text)) return "IDFC First Bank";
  if (/rbl\s+bank/i.test(text)) return "RBL Bank";
  return "Unknown Bank";
}

export function extractStatementPeriod(text: string): string | null {
  // "Statement from DD MMM YYYY to DD MMM YYYY" or "Period: Jun 2025"
  const period = text.match(
    /(?:period|from)[:\s]+(\d{2}\s+\w{3}\s+\d{4}|\w{3,9}\s+\d{4})/i,
  );
  if (period) return period[1];
  const monthYear = text.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}\b/i);
  if (monthYear) return monthYear[0];
  return null;
}

export function parseTransactionsFromText(text: string): {
  transactions: Transaction[];
  closingBalance: number | undefined;
} {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const transactions: Transaction[] = [];
  let closingBalance: number | undefined;

  for (const line of lines) {
    const dateMatch = line.match(DATE_RE);
    if (!dateMatch) continue;

    const amounts = line.match(AMOUNT_RE);
    if (!amounts || amounts.length === 0) continue;

    const date = normaliseDate(dateMatch[0]);
    const lastAmount = parseFloat(amounts[amounts.length - 1].replace(/,/g, ""));
    if (lastAmount) closingBalance = lastAmount;

    // Heuristic: if "Dr" appears after an amount, it's a debit; "Cr" → credit
    const isDr = /\bDr\.?\b/i.test(line);
    const isCr = /\bCr\.?\b/i.test(line);

    // Primary amount is either the 1st or 2nd-to-last figure
    const primaryAmount =
      amounts.length >= 2
        ? parseFloat(amounts[amounts.length - 2].replace(/,/g, ""))
        : parseFloat(amounts[0].replace(/,/g, ""));
    if (!primaryAmount || primaryAmount === lastAmount) continue;

    // Extract description: text between date and first amount
    const firstAmountIdx = line.indexOf(amounts[0]);
    const dateEnd = line.indexOf(dateMatch[0]) + dateMatch[0].length;
    const description = line.slice(dateEnd, firstAmountIdx).trim().replace(/\s+/g, " ");

    if (!description) continue;

    transactions.push({
      date,
      description,
      amount: primaryAmount,
      type: isDr ? "debit" : isCr ? "credit" : primaryAmount > 0 ? "debit" : "credit",
      balance: lastAmount,
    });
  }

  return { transactions, closingBalance };
}
