import type { Transaction } from "../types";

// ICICI Bank CSV format
// S No.,Value Date,Transaction Date,Cheque Number,Transaction Remarks,
// Withdrawal Amount (INR ),Deposit Amount (INR ),Balance (INR )
// Date format: DD/MM/YYYY

export function isIcici(headers: string[]): boolean {
  const h = headers.map((x) => x.toLowerCase().trim());
  return (
    h.some((x) => x.includes("transaction remarks")) &&
    h.some((x) => x.includes("withdrawal amount"))
  );
}

function parseDate(raw: string): string {
  // DD/MM/YYYY
  const [d, m, y] = raw.trim().split("/");
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

function parseAmount(raw: string): number {
  return parseFloat(raw.replace(/,/g, "").trim()) || 0;
}

export function parseIcici(rows: string[][]): {
  transactions: Transaction[];
  closingBalance: number | undefined;
} {
  const transactions: Transaction[] = [];
  let closingBalance: number | undefined;

  for (const row of rows) {
    if (row.length < 7) continue;
    // [sNo, valueDate, txDate, chequeNo, remarks, withdrawal, deposit, balance]
    const dateRaw = row[2]?.trim();
    const remarks = row[4]?.trim() ?? "";
    const withdrawal = parseAmount(row[5] ?? "0");
    const deposit = parseAmount(row[6] ?? "0");
    const balance = parseAmount(row[7] ?? "0");

    if (!dateRaw?.match(/\d{2}\/\d{2}\/\d{4}/)) continue;
    if (balance) closingBalance = balance;

    if (withdrawal > 0) {
      transactions.push({
        date: parseDate(dateRaw),
        description: remarks,
        amount: withdrawal,
        type: "debit",
        balance,
      });
    } else if (deposit > 0) {
      transactions.push({
        date: parseDate(dateRaw),
        description: remarks,
        amount: deposit,
        type: "credit",
        balance,
      });
    }
  }

  return { transactions, closingBalance };
}
