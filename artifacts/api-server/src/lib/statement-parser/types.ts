export interface Transaction {
  date: string;        // YYYY-MM-DD
  description: string;
  amount: number;
  type: "debit" | "credit";
  balance?: number;
  category?: string;   // assigned by categorizer
}

export interface BudgetSuggestion {
  monthlyIncome: number;
  items: Array<{ label: string; planned: number; actual: number }>;
}

export interface WealthSuggestion {
  closingBalance?: number;
  assets: Array<{
    label: string;
    amount: number;
    category: "STOCKS" | "MUTUAL_FUNDS" | "REAL_ESTATE" | "CASH" | "CRYPTO" | "OTHER";
  }>;
}

export interface EvaluationPrefill {
  netWorth: number;
  monthlyIncome: number;
  totalSaved: number;
  totalSpent: number;
  budgetedExpenses: number;
  emergencyFundBalance: number;
}

export interface ParseResult {
  bank: string;
  format: "csv" | "pdf" | "unknown";
  statementPeriod: string | null;  // e.g. "June 2025"
  confidence: "high" | "medium" | "low";
  transactionCount: number;
  transactions: Transaction[];
  budgetSuggestion: BudgetSuggestion;
  wealthSuggestion: WealthSuggestion;
  evaluationPrefill: EvaluationPrefill;
  warnings: string[];
}
