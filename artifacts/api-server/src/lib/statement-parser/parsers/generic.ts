import type { Transaction } from "../types";

// Generic CSV fallback: tries to identify date/debit/credit/description columns
// by header keywords, then parses accordingly.

function parseAmount(raw: string): number {
  return parseFloat(raw.replace(/,/g, "").trim()) || 0;
}

function parseDate(raw: string): string {
  raw = raw.trim();
  // DD/MM/YYYY or DD-MM-YYYY
  const slash = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (slash) {
    const [, d, m, y] = slash;
    const year = y.length === 2 ? `20${y}` : y;
    return `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  // YYYY-MM-DD
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return raw;
  return raw;
}

function findColIdx(headers: string[], ...keywords: string[]): number {
  return headers.findIndex((h) =>
    keywords.some((kw) => h.toLowerCase().includes(kw.toLowerCase())),
  );
}

export function parseGeneric(
  rows: string[][],
  headers: string[],
): {
  transactions: Transaction[];
  closingBalance: number | undefined;
  confidence: "medium" | "low";
} {
  const dateIdx = findColIdx(headers, "date", "dt");
  const descIdx = findColIdx(
    headers,
    "narration",
    "description",
    "particulars",
    "remarks",
    "details",
    "transaction",
  );
  const debitIdx = findColIdx(
    headers,
    "debit",
    "withdrawal",
    "dr.",
    "dr ",
    "amount(dr)",
  );
  const creditIdx = findColIdx(
    headers,
    "credit",
    "deposit",
    "cr.",
    "cr ",
    "amount(cr)",
  );
  const balanceIdx = findColIdx(headers, "balance", "bal.", "closing");

  const transactions: Transaction[] = [];
  let closingBalance: number | undefined;

  const confidence: "medium" | "low" =
    dateIdx !== -1 && descIdx !== -1 && (debitIdx !== -1 || creditIdx !== -1)
      ? "medium"
      : "low";

  if (confidence === "low") return { transactions, closingBalance, confidence };

  for (const row of rows) {
    const dateRaw = row[dateIdx]?.trim();
    if (!dateRaw || dateRaw.length < 4) continue;
    const description = descIdx !== -1 ? (row[descIdx]?.trim() ?? "") : "";
    const debit = debitIdx !== -1 ? parseAmount(row[debitIdx] ?? "0") : 0;
    const credit = creditIdx !== -1 ? parseAmount(row[creditIdx] ?? "0") : 0;
    const balance =
      balanceIdx !== -1 ? parseAmount(row[balanceIdx] ?? "0") : 0;
    if (balance) closingBalance = balance;

    if (debit > 0) {
      transactions.push({
        date: parseDate(dateRaw),
        description,
        amount: debit,
        type: "debit",
        balance,
      });
    } else if (credit > 0) {
      transactions.push({
        date: parseDate(dateRaw),
        description,
        amount: credit,
        type: "credit",
        balance,
      });
    }
  }

  return { transactions, closingBalance, confidence };
}
