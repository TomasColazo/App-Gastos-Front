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

export type ExpenseStatus = 'PAID' | 'PENDING';

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
  status: ExpenseStatus;
  category: Category;
  installmentNumber?: number;
  totalInstallments?: number;
  isRecurring: boolean;
  recurrenceDay?: number;
  receiptUrl?: string;       // Enlace a Google Drive o comprobante
  referenceCode?: string;    // N° contrato EPEC, cuenta Ecogas, etc.
  period?: string;           // Ej: 2026/10, 5.1-2
  createdAt?: string;
}

export interface ExpenseRequest {
  title: string;
  description?: string;
  amount: number;
  currency: Currency;
  date?: string;
  expenseType: ExpenseType;
  paymentMethod: PaymentMethod;
  status?: ExpenseStatus;
  categoryId: number;
  installmentNumber?: number;
  totalInstallments?: number;
  isRecurring?: boolean;
  recurrenceDay?: number;
  receiptUrl?: string;
  referenceCode?: string;
  period?: string;
}

export interface CategoryBreakdownItem {
  categoryId: number;
  categoryName: string;
  color: string;
  icon: string;
  totalArs: number;
  totalUsd: number;
  count: number;
  percentageArs: number;
}

export interface ExpenseSummary {
  totalsByCurrency: Record<string, number>;
  paidByCurrency: Record<string, number>;
  pendingByCurrency: Record<string, number>;
  totalsByType: Record<string, number>;
  categoryBreakdown: CategoryBreakdownItem[];
  totalExpensesCount: number;
  paidCount: number;
  pendingCount: number;
  previousMonthTotalArs: number;
  month: number;
  year: number;
}

export interface ExpenseFilterParams {
  year?: number | null;
  month?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  categoryId?: number | null;
  type?: ExpenseType | null;
  status?: ExpenseStatus | null;
  currency?: Currency | null;
  paymentMethod?: PaymentMethod | null;
  search?: string | null;
}
