// Main statement parser entry point.
// Accepts a file buffer + mimetype and returns a ParseResult.

import Papa from "papaparse";
import { createRequire } from "node:module";
const _require = createRequire(import.meta.url);
// pdf-parse is CJS-only; use createRequire so ESM loader doesn't choke on it
const pdfParse: (buf: Buffer) => Promise<{ text: string }> = _require("pdf-parse");

import type { ParseResult, Transaction } from "./types";
import { assignCategory, buildBudgetItems, detectInvestmentCredits } from "./categorize";
import { isHdfc, parseHdfc } from "./parsers/hdfc";
import { isIcici, parseIcici } from "./parsers/icici";
import { isSbi, parseSbi } from "./parsers/sbi";
import { isAxis, parseAxis } from "./parsers/axis";
import { isKotak, parseKotak } from "./parsers/kotak";
import { isYesBank, parseYesBank } from "./parsers/yes-bank";
import { isIndusInd, parseIndusInd } from "./parsers/indusind";
import { parseGeneric } from "./parsers/generic";
import { extractBankName, extractStatementPeriod, parseTransactionsFromText } from "./pdf";

// ─── CSV parsing ──────────────────────────────────────────────────────────────

function parseCsv(buffer: Buffer): ParseResult {
  const text = buffer.toString("utf8");

  const { data: rawRows } = Papa.parse<string[]>(text, {
    skipEmptyLines: true,
    delimiter: ",",
  });

  if (rawRows.length < 2) {
    return failedResult("csv", "Could not parse CSV — too few rows.");
  }

  // Find the header row: first row that contains recognisable column words
  let headerRowIdx = 0;
  for (let i = 0; i < Math.min(10, rawRows.length); i++) {
    const row = rawRows[i].map((c) => c.toLowerCase().trim());
    if (
      row.some((c) =>
        ["date", "narration", "description", "particulars", "transaction"].some(
          (kw) => c.includes(kw),
        ),
      )
    ) {
      headerRowIdx = i;
      break;
    }
  }

  const headers = rawRows[headerRowIdx].map((h) => h.trim());
  const dataRows = rawRows.slice(headerRowIdx + 1);

  let bank = "Unknown Bank";
  let transactions: Transaction[] = [];
  let closingBalance: number | undefined;
  let confidence: ParseResult["confidence"] = "high";

  if (isHdfc(headers)) {
    bank = "HDFC Bank";
    ({ transactions, closingBalance } = parseHdfc(dataRows));
  } else if (isIcici(headers)) {
    bank = "ICICI Bank";
    ({ transactions, closingBalance } = parseIcici(dataRows));
  } else if (isSbi(headers)) {
    bank = "SBI";
    ({ transactions, closingBalance } = parseSbi(dataRows));
  } else if (isAxis(headers)) {
    bank = "Axis Bank";
    ({ transactions, closingBalance } = parseAxis(dataRows, headers));
  } else if (isKotak(headers)) {
    bank = "Kotak Mahindra Bank";
    ({ transactions, closingBalance } = parseKotak(dataRows));
  } else if (isYesBank(headers)) {
    bank = "Yes Bank";
    ({ transactions, closingBalance } = parseYesBank(dataRows));
  } else if (isIndusInd(headers)) {
    bank = "IndusInd Bank";
    ({ transactions, closingBalance } = parseIndusInd(dataRows));
  } else {
    // Generic fallback
    const result = parseGeneric(dataRows, headers);
    transactions = result.transactions;
    closingBalance = result.closingBalance;
    confidence = result.confidence;
  }

  return buildResult({ bank, format: "csv", transactions, closingBalance, confidence, text });
}

// ─── PDF parsing ──────────────────────────────────────────────────────────────

async function parsePdf(buffer: Buffer): Promise<ParseResult> {
  let text: string;
  try {
    const data = await pdfParse(buffer);
    text = data.text;
  } catch {
    return failedResult("pdf", "Could not read PDF. Try exporting as CSV from your bank's netbanking portal.");
  }

  const bank = extractBankName(text);
  const statementPeriod = extractStatementPeriod(text);
  const { transactions, closingBalance } = parseTransactionsFromText(text);

  return buildResult({
    bank,
    format: "pdf",
    transactions,
    closingBalance,
    confidence: transactions.length > 5 ? "medium" : "low",
    text,
    statementPeriod,
  });
}

// ─── Build final ParseResult from parsed transactions ────────────────────────

function buildResult(opts: {
  bank: string;
  format: "csv" | "pdf" | "unknown";
  transactions: Transaction[];
  closingBalance: number | undefined;
  confidence: ParseResult["confidence"];
  text: string;
  statementPeriod?: string | null;
}): ParseResult {
  const { bank, format, transactions, closingBalance, confidence, text, statementPeriod } = opts;

  // Assign categories
  const categorised: Transaction[] = transactions.map((tx) => ({
    ...tx,
    category: assignCategory(tx.description).label,
  }));

  const warnings: string[] = [];
  if (confidence === "low") {
    warnings.push(
      "Statement format not recognised. Results may be incomplete. For best results, export your statement as CSV from your bank's netbanking portal.",
    );
  }
  if (format === "pdf") {
    warnings.push(
      "PDF extraction is best-effort. Verify the amounts before applying.",
    );
  }

  // Sum total income from credits (excluding transfers)
  const monthlyIncome = categorised
    .filter((tx) => tx.type === "credit" && tx.category === "INCOME")
    .reduce((s, t) => s + t.amount, 0);

  const totalSpent = categorised
    .filter((tx) => tx.type === "debit" && tx.category !== "Transfers")
    .reduce((s, t) => s + t.amount, 0);

  const totalSaved = Math.max(0, monthlyIncome - totalSpent);

  // Detect period from text if not already found
  const resolvedPeriod =
    statementPeriod ??
    (text ? extractStatementPeriod(text) : null);

  // Build budget suggestions
  const items = buildBudgetItems(categorised, monthlyIncome);

  // Wealth: closing balance as CASH asset + any detected investment flows
  const wealthAssets: ParseResult["wealthSuggestion"]["assets"] = [];
  if (closingBalance && closingBalance > 0) {
    wealthAssets.push({
      label: `${bank} — Savings Account`,
      amount: Math.round(closingBalance),
      category: "CASH",
    });
  }
  const investmentAssets = detectInvestmentCredits(categorised);
  for (const ia of investmentAssets) {
    wealthAssets.push(ia);
  }

  return {
    bank,
    format,
    statementPeriod: resolvedPeriod ?? null,
    confidence,
    transactionCount: categorised.length,
    transactions: categorised,
    budgetSuggestion: {
      monthlyIncome: Math.round(monthlyIncome),
      items,
    },
    wealthSuggestion: {
      closingBalance,
      assets: wealthAssets,
    },
    evaluationPrefill: {
      netWorth: closingBalance ?? 0,
      monthlyIncome: Math.round(monthlyIncome),
      totalSaved: Math.round(totalSaved),
      totalSpent: Math.round(totalSpent),
      budgetedExpenses: items.reduce((s, i) => s + i.planned, 0),
      emergencyFundBalance: closingBalance ?? 0,
    },
    warnings,
  };
}

function failedResult(format: "csv" | "pdf" | "unknown", warning: string): ParseResult {
  return {
    bank: "Unknown Bank",
    format,
    statementPeriod: null,
    confidence: "low",
    transactionCount: 0,
    transactions: [],
    budgetSuggestion: { monthlyIncome: 0, items: [] },
    wealthSuggestion: { assets: [] },
    evaluationPrefill: {
      netWorth: 0,
      monthlyIncome: 0,
      totalSaved: 0,
      totalSpent: 0,
      budgetedExpenses: 0,
      emergencyFundBalance: 0,
    },
    warnings: [warning],
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function parseStatement(
  buffer: Buffer,
  mimetype: string,
  originalName: string,
): Promise<ParseResult> {
  const ext = originalName.split(".").pop()?.toLowerCase() ?? "";
  const isPdf =
    mimetype === "application/pdf" || ext === "pdf";

  if (isPdf) return parsePdf(buffer);
  return parseCsv(buffer);
}
