import type { Transaction } from "../types";

// Axis Bank CSV format
// Tran Date,CHQNO,Particulars,Debit,Credit,Balance
// Also: Transaction Date,Particulars,Chq No,Debit,Credit,Balance (variant)
// Date format: DD-MM-YYYY

export function isAxis(headers: string[]): boolean {
  const h = headers.map((x) => x.toLowerCase().trim());
  return (
    (h.some((x) => x.includes("tran date") || x.includes("transaction date"))) &&
    h.some((x) => x.includes("particulars"))
  );
}

function parseDate(raw: string): string {
  // DD-MM-YYYY or DD/MM/YYYY
  raw = raw.trim().replace(/\//g, "-");
  const [d, m, y] = raw.split("-");
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

function parseAmount(raw: string): number {
  return parseFloat(raw.replace(/,/g, "").trim()) || 0;
}

export function parseAxis(rows: string[][], headers: string[]): {
  transactions: Transaction[];
  closingBalance: number | undefined;
} {
  const transactions: Transaction[] = [];
  let closingBalance: number | undefined;

  // Detect column positions by header
  const h = headers.map((x) => x.toLowerCase().trim());
  const dateIdx = h.findIndex((x) => x.includes("tran date") || x.includes("transaction date"));
  const descIdx = h.findIndex((x) => x.includes("particulars"));
  const debitIdx = h.findIndex((x) => x === "debit" || x.includes("debit"));
  const creditIdx = h.findIndex((x) => x === "credit" || x.includes("credit"));
  const balanceIdx = h.findIndex((x) => x === "balance" || x.includes("balance"));

  if (dateIdx === -1 || descIdx === -1) return { transactions, closingBalance };

  for (const row of rows) {
    const dateRaw = row[dateIdx]?.trim();
    const description = row[descIdx]?.trim() ?? "";
    const debit = parseAmount(row[debitIdx] ?? "0");
    const credit = parseAmount(row[creditIdx] ?? "0");
    const balance = parseAmount(row[balanceIdx] ?? "0");

    if (!dateRaw?.match(/\d{2}[-/]\d{2}[-/]\d{4}/)) continue;
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

  return { transactions, closingBalance };
}
