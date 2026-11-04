import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import {
  Expense,
  Category,
  ExpenseType,
  Currency,
  PaymentMethod,
  ExpenseStatus,
  ExpenseFilterParams,
  ExpenseRequest
} from '../../models/expense.model';

@Component({
  selector: 'app-expenses-grid',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './expenses-grid.component.html'
})
export class ExpensesGridComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  isLoading = signal<boolean>(false);
  categories = signal<Category[]>([]);
  expenses = signal<Expense[]>([]);

  // Parámetros de filtro
  filterSearch = '';
  filterYear: number | null = 2026;
  filterMonth: number | null = null;
  filterStartDate = '';
  filterEndDate = '';
  filterCategoryId: number | null = null;
  filterType: ExpenseType | null = null;
  filterStatus: ExpenseStatus | null = null;
  filterCurrency: Currency | null = null;
  filterPaymentMethod: PaymentMethod | null = null;

  // Ordenamiento de la tabla
  sortColumn = signal<'date' | 'title' | 'amount' | 'category'>('date');
  sortDirection = signal<'asc' | 'desc'>('desc');

  // Modal de Edición
  editingExpense = signal<Expense | null>(null);
  editTitle = '';
  editDescription = '';
  editAmount = 0;
  editCurrency: Currency = 'ARS';
  editDate = '';
  editType: ExpenseType = 'SERVICE';
  editPaymentMethod: PaymentMethod = 'DEBIT_CARD';
  editStatus: ExpenseStatus = 'PAID';
  editCategoryId = 1;
  editReferenceCode = '';
  editPeriod = '';
  editReceiptUrl = '';

  readonly monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  ngOnInit(): void {
    this.auth.ensureAuthenticated().subscribe((ok) => {
      if (ok) {
        this.api.getCategories().subscribe((cats) => this.categories.set(cats));
        this.applyFilters();
      }
    });
  }

  applyFilters(): void {
    this.isLoading.set(true);
    const params: ExpenseFilterParams = {
      search: this.filterSearch || null,
      year: this.filterYear,
      month: this.filterMonth,
      startDate: this.filterStartDate || null,
      endDate: this.filterEndDate || null,
      categoryId: this.filterCategoryId,
      type: this.filterType,
      status: this.filterStatus,
      currency: this.filterCurrency,
      paymentMethod: this.filterPaymentMethod
    };

    this.api.getExpenses(params).subscribe({
      next: (data) => {
        this.expenses.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  clearFilters(): void {
    this.filterSearch = '';
    this.filterYear = null;
    this.filterMonth = null;
    this.filterStartDate = '';
    this.filterEndDate = '';
    this.filterCategoryId = null;
    this.filterType = null;
    this.filterStatus = null;
    this.filterCurrency = null;
    this.filterPaymentMethod = null;
    this.applyFilters();
  }

  toggleSort(col: 'date' | 'title' | 'amount' | 'category'): void {
    if (this.sortColumn() === col) {
      this.sortDirection.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortColumn.set(col);
      this.sortDirection.set('desc');
    }
  }

  get sortedExpenses(): Expense[] {
    const col = this.sortColumn();
    const dir = this.sortDirection() === 'asc' ? 1 : -1;

    return [...this.expenses()].sort((a, b) => {
      if (col === 'date') {
        return a.date.localeCompare(b.date) * dir;
      }
      if (col === 'title') {
        return a.title.localeCompare(b.title) * dir;
      }
      if (col === 'amount') {
        return (Number(a.amount) - Number(b.amount)) * dir;
      }
      if (col === 'category') {
        return a.category.name.localeCompare(b.category.name) * dir;
      }
      return 0;
    });
  }

  get filteredTotalArs(): number {
    return this.expenses()
      .filter((e) => e.currency === 'ARS')
      .reduce((acc, c) => acc + Number(c.amount), 0);
  }

  get filteredPaidArs(): number {
    return this.expenses()
      .filter((e) => e.currency === 'ARS' && e.status === 'PAID')
      .reduce((acc, c) => acc + Number(c.amount), 0);
  }

  get filteredPendingArs(): number {
    return this.expenses()
      .filter((e) => e.currency === 'ARS' && e.status === 'PENDING')
      .reduce((acc, c) => acc + Number(c.amount), 0);
  }

  get filteredTotalUsd(): number {
    return this.expenses()
      .filter((e) => e.currency === 'USD')
      .reduce((acc, c) => acc + Number(c.amount), 0);
  }

  toggleStatus(expense: Expense): void {
    const newStatus: ExpenseStatus = expense.status === 'PAID' ? 'PENDING' : 'PAID';
    const payload: ExpenseRequest = {
      title: expense.title,
      description: expense.description,
      amount: expense.amount,
      currency: expense.currency,
      date: expense.date,
      expenseType: expense.expenseType,
      paymentMethod: expense.paymentMethod,
      status: newStatus,
      categoryId: expense.category.id,
      referenceCode: expense.referenceCode,
      period: expense.period,
      receiptUrl: expense.receiptUrl,
      isRecurring: expense.isRecurring,
      recurrenceDay: expense.recurrenceDay,
      installmentNumber: expense.installmentNumber,
      totalInstallments: expense.totalInstallments
    };

    this.api.updateExpense(expense.id, payload).subscribe({
      next: (updated) => {
        this.expenses.update((list) => list.map((e) => (e.id === expense.id ? updated : e)));
      }
    });
  }

  openEditModal(expense: Expense): void {
    this.editingExpense.set(expense);
    this.editTitle = expense.title;
    this.editDescription = expense.description || '';
    this.editAmount = expense.amount;
    this.editCurrency = expense.currency;
    this.editDate = expense.date;
    this.editType = expense.expenseType;
    this.editPaymentMethod = expense.paymentMethod;
    this.editStatus = expense.status;
    this.editCategoryId = expense.category.id;
    this.editReferenceCode = expense.referenceCode || '';
    this.editPeriod = expense.period || '';
    this.editReceiptUrl = expense.receiptUrl || '';
  }

  closeEditModal(): void {
    this.editingExpense.set(null);
  }

  saveEdit(): void {
    const exp = this.editingExpense();
    if (!exp) return;

    const selectedCat = this.categories().find((c) => c.id === Number(this.editCategoryId));
    const inferredType: ExpenseType = selectedCat?.suggestedType || exp.expenseType || 'DAILY';

    const payload: ExpenseRequest = {
      title: this.editTitle.trim(),
      description: this.editDescription.trim() || undefined,
      amount: this.editAmount,
      currency: this.editCurrency,
      date: this.editDate,
      expenseType: inferredType,
      paymentMethod: this.editPaymentMethod,
      status: this.editStatus,
      categoryId: Number(this.editCategoryId),
      referenceCode: this.editReferenceCode.trim() || undefined,
      period: this.editPeriod.trim() || undefined,
      receiptUrl: this.editReceiptUrl.trim() || undefined,
      isRecurring: exp.isRecurring,
      recurrenceDay: exp.recurrenceDay,
      installmentNumber: exp.installmentNumber,
      totalInstallments: exp.totalInstallments
    };

    this.api.updateExpense(exp.id, payload).subscribe({
      next: (updated) => {
        this.expenses.update((list) => list.map((e) => (e.id === exp.id ? updated : e)));
        this.closeEditModal();
      }
    });
  }

  deleteExpense(id: number): void {
    if (!confirm('¿Confirmas que deseas eliminar este registro de la base de datos?')) return;
    this.api.deleteExpense(id).subscribe({
      next: () => {
        this.expenses.update((list) => list.filter((e) => e.id !== id));
      }
    });
  }

  exportToCsv(): void {
    const rows = this.sortedExpenses;
    if (rows.length === 0) return;

    const headers = ['Fecha', 'Concepto', 'Categoria', 'Tipo', 'Periodo', 'Cuenta/Contrato', 'Medio de Pago', 'Estado', 'Moneda', 'Monto', 'Comprobante Drive'];
    const csvLines = [
      headers.join(','),
      ...rows.map((r) => [
        r.date,
        `"${(r.title || '').replace(/"/g, '""')}"`,
        `"${(r.category?.name || '').replace(/"/g, '""')}"`,
        r.expenseType,
        `"${(r.period || '').replace(/"/g, '""')}"`,
        `"${(r.referenceCode || '').replace(/"/g, '""')}"`,
        r.paymentMethod,
        r.status,
        r.currency,
        r.amount,
        `"${(r.receiptUrl || '').replace(/"/g, '""')}"`
      ].join(','))
    ];

    const blob = new Blob(['\uFEFF' + csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gastos_consulta_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  getCategoryIcon(icon?: string): string {
    const icons: Record<string, string> = {
      'zap': '⚡',
      'landmark': '🏛️',
      'phone': '📱',
      'shopping-cart': '🛒',
      'gamepad': '🎮',
      'utensils': '🍽️',
      'car': '🚗',
      'heart-pulse': '💊',
      'coffee': '☕',
      'tag': '🏷️'
    };
    return icons[icon || ''] || '🏷️';
  }

  formatShortDate(dateStr: string): string {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0].slice(2)}`;
  }

  formatPaymentMethodShort(pm: PaymentMethod): string {
    const map: Record<PaymentMethod, string> = {
      CASH: 'Efectivo',
      DEBIT_CARD: 'Débito',
      CREDIT_CARD: 'Crédito',
      BANK_TRANSFER: 'Transf./DA',
      DIGITAL_WALLET: 'Billetera'
    };
    return map[pm] || pm;
  }
}
