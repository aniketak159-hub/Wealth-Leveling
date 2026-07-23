import type { Transaction } from "../types";

// IndusInd Bank CSV
// Date,Narration,Chq./ Ref.No.,Value Date,Withdrawal Amt.(Dr.),Deposit Amt.(Cr.),Running Balance(Cr.)

export function isIndusInd(headers: string[]): boolean {
  const h = headers.map((x) => x.toLowerCase().trim());
  return (
    h.some((x) => x.includes("narration")) &&
    h.some((x) => x.includes("running balance"))
  );
}

function parseDate(raw: string): string {
  const [d, m, y] = raw.trim().split("/");
  const year = y.length === 2 ? `20${y}` : y;
  return `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

function parseAmount(raw: string): number {
  return parseFloat(raw.replace(/,/g, "").trim()) || 0;
}

export function parseIndusInd(rows: string[][]): {
  transactions: Transaction[];
  closingBalance: number | undefined;
} {
  const transactions: Transaction[] = [];
  let closingBalance: number | undefined;

  for (const row of rows) {
    if (row.length < 6) continue;
    const [dateRaw, narration, , , withdrawalRaw, depositRaw, balanceRaw] = row;
    if (!dateRaw?.match(/\d{2}\/\d{2}\/\d{2,4}/)) continue;

    const withdrawal = parseAmount(withdrawalRaw ?? "0");
    const deposit = parseAmount(depositRaw ?? "0");
    const balance = parseAmount(balanceRaw ?? "0");
    if (balance) closingBalance = balance;

    if (withdrawal > 0) {
      transactions.push({ date: parseDate(dateRaw), description: narration.trim(), amount: withdrawal, type: "debit", balance });
    } else if (deposit > 0) {
      transactions.push({ date: parseDate(dateRaw), description: narration.trim(), amount: deposit, type: "credit", balance });
    }
  }
  return { transactions, closingBalance };
}
