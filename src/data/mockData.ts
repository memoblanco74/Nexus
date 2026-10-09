import { AutoDeductLog } from '../types';

export const INITIAL_AUTO_DEDUCTIONS: AutoDeductLog[] = [];

export const FINANCIAL_METRICS = {
  totalIncome: 0,
  incomeChange: '0.0%',
  totalExpenses: 0,
  expensesChange: '0.0%',
  netProfit: 0,
  profitChange: '0.0%',
  estimatedTaxes: 0,
  taxesChange: '0.0%',
  totalRevenueMrr: 0,
  mrrChange: '0.0%',
  monthlyTrends: [] as Array<{
    month: string;
    income: number;
    expenses: number;
    profit: number;
    barPct: number;
    lossPct: number;
  }>,
};
