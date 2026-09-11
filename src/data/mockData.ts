import {
  AutoDeductLog,
} from '../types';

export const INITIAL_AUTO_DEDUCTIONS: AutoDeductLog[] = [];

export const FINANCIAL_METRICS = {
  totalIncome: 124500,
  incomeChange: '+12.5% vs last month',
  totalExpenses: 42300,
  expensesChange: '+4.2% vs last month',
  netProfit: 82200,
  profitChange: '+18% YTD',
  estimatedTaxes: 16439.9,
  taxesChange: '0.0%',
  totalRevenueMrr: 284500,
  mrrChange: '+22%',
  monthlyTrends: [
    { month: 'Jan', income: 88000, expenses: 32000, profit: 56000, barPct: 40, lossPct: 50 },
    { month: 'Feb', income: 94000, expenses: 36000, profit: 58000, barPct: 55, lossPct: 40 },
    { month: 'Mar', income: 82000, expenses: 30000, profit: 52000, barPct: 30, lossPct: 45 },
    { month: 'Apr', income: 105000, expenses: 38000, profit: 67000, barPct: 70, lossPct: 60 },
    { month: 'May', income: 116000, expenses: 40000, profit: 76000, barPct: 85, lossPct: 55 },
    { month: 'Jun', income: 124500, expenses: 42300, profit: 82200, barPct: 100, lossPct: 70 },
  ],
};
