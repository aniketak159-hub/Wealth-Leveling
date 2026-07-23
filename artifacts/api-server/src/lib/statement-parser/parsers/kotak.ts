import type { Transaction } from "../types";

// Kotak Mahindra Bank CSV format
// Transaction Date,Value Date,Description,Chq / Ref number,Debit,Credit,Balance
// Date format: DD-MM-YYYY

export function isKotak(headers: string[]): boolean {
  const h = headers.map((x) => x.toLowerCase().trim());
  return (
    h.some((x) => x.includes("transaction date")) &&
    h.some((x) => x.includes("description")) &&
    h.some((x) => x.includes("chq") || x.includes("ref number"))
  );
}

function parseDate(raw: string): string {
  raw = raw.trim().replace(/\//g, "-");
  const [d, m, y] = raw.split("-");
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

function parseAmount(raw: string): number {
  return parseFloat(raw.replace(/,/g, "").trim()) || 0;
}

export function parseKotak(rows: string[][]): {
  transactions: Transaction[];
  closingBalance: number | undefined;
} {
  const transactions: Transaction[] = [];
  let closingBalance: number | undefined;

  for (const row of rows) {
    if (row.length < 6) continue;
    // [txDate, valueDate, description, refNo, debit, credit, balance]
    const dateRaw = row[0]?.trim();
    const description = row[2]?.trim() ?? "";
    const debit = parseAmount(row[4] ?? "0");
    const credit = parseAmount(row[5] ?? "0");
    const balance = parseAmount(row[6] ?? "0");

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
