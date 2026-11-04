export type Currency = 'ARS' | 'USD' | 'EUR' | 'BRL' | 'CLP' | 'UYU';

export type ExpenseType =
  | 'DAILY'
  | 'GROCERY'
  | 'SERVICE'
  | 'SUBSCRIPTION'
  | 'INSTALLMENT'
  | 'LEISURE'
  | 'HEALTH'
  | 'TRANSPORT'
  | 'OTHER';

export type PaymentMethod =
  | 'CASH'
  | 'DEBIT_CARD'
  | 'CREDIT_CARD'
  | 'BANK_TRANSFER'
  | 'DIGITAL_WALLET';

export interface Category {
  id: number;
  name: string;
  icon?: string;
  color?: string;
  suggestedType?: ExpenseType;
  isSystemDefault: boolean;
}

export interface Expense {
  id: number;
  title: string;
  description?: string;
  amount: number;
  currency: Currency;
  date: string;
  expenseType: ExpenseType;
  paymentMethod: PaymentMethod;
  category: Category;
  installmentNumber?: number;
  totalInstallments?: number;
  isRecurring: boolean;
  recurrenceDay?: number;
  createdAt: string;
}

export interface ExpenseSummary {
  totalsByCurrency: Record<string, number>;
  totalsByType: Record<string, number>;
  totalExpensesCount: number;
  month: number;
  year: number;
}
