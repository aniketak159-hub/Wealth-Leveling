import type { Transaction } from "../types";

// SBI Bank CSV / text format
// Txn Date,Value Date,Description,Ref No./Cheque No.,Debit,Credit,Balance
// Date format: DD MMM YYYY  (e.g. 01 Jun 2025)

export function isSbi(headers: string[]): boolean {
  const h = headers.map((x) => x.toLowerCase().trim());
  return (
    h.some((x) => x.includes("txn date") || x.includes("txn. date")) &&
    h.some((x) => x === "debit" || x.includes("debit")) &&
    h.some((x) => x === "credit" || x.includes("credit"))
  );
}

const MONTH_MAP: Record<string, string> = {
  jan: "01", feb: "02", mar: "03", apr: "04",
  may: "05", jun: "06", jul: "07", aug: "08",
  sep: "09", oct: "10", nov: "11", dec: "12",
};

function parseDate(raw: string): string {
  // DD MMM YYYY or DD/MM/YYYY
  raw = raw.trim();
  if (raw.includes("/")) {
    const [d, m, y] = raw.split("/");
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const parts = raw.split(/\s+/);
  if (parts.length === 3) {
    const [d, mon, y] = parts;
    const m = MONTH_MAP[mon.toLowerCase().slice(0, 3)] ?? "01";
    return `${y}-${m}-${d.padStart(2, "0")}`;
  }
  return raw;
}

function parseAmount(raw: string): number {
  return parseFloat(raw.replace(/,/g, "").trim()) || 0;
}

export function parseSbi(rows: string[][]): {
  transactions: Transaction[];
  closingBalance: number | undefined;
} {
  const transactions: Transaction[] = [];
  let closingBalance: number | undefined;

  for (const row of rows) {
    if (row.length < 6) continue;
    // [txnDate, valueDate, description, refNo, debit, credit, balance]
    const dateRaw = row[0]?.trim();
    const description = row[2]?.trim() ?? "";
    const debit = parseAmount(row[4] ?? "0");
    const credit = parseAmount(row[5] ?? "0");
    const balance = parseAmount(row[6] ?? "0");

    if (!dateRaw || dateRaw.length < 6) continue;
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
