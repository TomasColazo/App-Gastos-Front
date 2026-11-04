import { Component, OnInit, inject, signal, computed } from '@angular/core';
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
  ExpenseRequest,
  ExpenseSummary
} from '../../models/expense.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  // Selector de Mes y Año
  selectedYear = signal<number>(new Date().getFullYear());
  selectedMonth = signal<number>(new Date().getMonth() + 1);

  readonly monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  readonly availableYears = [2024, 2025, 2026, 2027];

  isLoading = signal<boolean>(false);
  categories = signal<Category[]>([]);
  expenses = signal<Expense[]>([]);
  summary = signal<ExpenseSummary | null>(null);

  // Filtros rápidos dentro del mes (unificados por Categoría y Estado)
  statusFilter = signal<'ALL' | 'PAID' | 'PENDING'>('ALL');
  categoryFilter = signal<number | null>(null);

  // Estado del formulario (Alta o Edición)
  editingId = signal<number | null>(null);
  formTitle = '';
  formDescription = '';
  formAmount: number | null = null;
  formCurrency: Currency = 'ARS';
  formDate: string = new Date().toISOString().split('T')[0];
  formPaymentMethod: PaymentMethod = 'DEBIT_CARD';
  formStatus: ExpenseStatus = 'PAID';
  formCategoryId: number | null = null;
  formReferenceCode = '';
  formPeriod = '';
  formReceiptUrl = '';
  formInstallmentNumber: number | null = null;
  formTotalInstallments: number | null = null;
  formIsRecurring = false;
  formRecurrenceDay: number | null = null;
  showAdvancedFields = false;

  selectedMonthName = computed(() => this.monthNames[this.selectedMonth() - 1]);

  ngOnInit(): void {
    this.auth.ensureAuthenticated().subscribe((ok) => {
      if (ok) {
        this.loadCategories();
        this.loadMonthData();
      }
    });
  }

  loadCategories(): void {
    this.api.getCategories().subscribe({
      next: (cats) => {
        this.categories.set(cats);
        if (cats.length > 0 && !this.formCategoryId) {
          this.formCategoryId = cats[0].id;
        }
      }
    });
  }

  loadMonthData(): void {
    const year = this.selectedYear();
    const month = this.selectedMonth();
    this.isLoading.set(true);

    this.api.getExpenses({ year, month }).subscribe({
      next: (list) => {
        this.expenses.set(list);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });

    this.api.getMonthlySummary(year, month).subscribe({
      next: (sum) => this.summary.set(sum)
    });
  }

  prevMonth(): void {
    if (this.selectedMonth() === 1) {
      this.selectedMonth.set(12);
      this.selectedYear.update((y) => y - 1);
    } else {
      this.selectedMonth.update((m) => m - 1);
    }
    this.syncDefaultDateToSelectedMonth();
    this.loadMonthData();
  }

  nextMonth(): void {
    if (this.selectedMonth() === 12) {
      this.selectedMonth.set(1);
      this.selectedYear.update((y) => y + 1);
    } else {
      this.selectedMonth.update((m) => m + 1);
    }
    this.syncDefaultDateToSelectedMonth();
    this.loadMonthData();
  }

  goToCurrentMonth(): void {
    const now = new Date();
    this.selectedYear.set(now.getFullYear());
    this.selectedMonth.set(now.getMonth() + 1);
    this.formDate = now.toISOString().split('T')[0];
    this.loadMonthData();
  }

  onMonthYearChange(year: number, month: number): void {
    this.selectedYear.set(Number(year));
    this.selectedMonth.set(Number(month));
    this.syncDefaultDateToSelectedMonth();
    this.loadMonthData();
  }

  private syncDefaultDateToSelectedMonth(): void {
    if (!this.editingId()) {
      const y = this.selectedYear();
      const m = String(this.selectedMonth()).padStart(2, '0');
      this.formDate = `${y}-${m}-10`;
    }
  }

  get filteredExpenses(): Expense[] {
    return this.expenses().filter((e) => {
      const matchStatus = this.statusFilter() === 'ALL' || e.status === this.statusFilter();
      const matchCategory = !this.categoryFilter() || e.category.id === this.categoryFilter();
      return matchStatus && matchCategory;
    });
  }

  get totalArs(): number {
    return this.summary()?.totalsByCurrency?.['ARS'] ?? 0;
  }

  get paidArs(): number {
    return this.summary()?.paidByCurrency?.['ARS'] ?? 0;
  }

  get pendingArs(): number {
    return this.summary()?.pendingByCurrency?.['ARS'] ?? 0;
  }

  get totalUsd(): number {
    return this.summary()?.totalsByCurrency?.['USD'] ?? 0;
  }

  get paidPercentage(): number {
    const total = this.totalArs;
    if (total <= 0) return 0;
    return Math.round((this.paidArs / total) * 100);
  }

  get monthOverMonthDiffPct(): number | null {
    const prev = this.summary()?.previousMonthTotalArs ?? 0;
    const curr = this.totalArs;
    if (prev <= 0) return null;
    return Number((((curr - prev) / prev) * 100).toFixed(1));
  }

  toggleCategoryFilter(catId: number | null): void {
    if (catId === null || this.categoryFilter() === catId) {
      this.categoryFilter.set(null);
    } else {
      this.categoryFilter.set(catId);
    }
  }

  private inferTypeFromCategory(categoryId: number): ExpenseType {
    const cat = this.categories().find((c) => c.id === Number(categoryId));
    return cat?.suggestedType || 'DAILY';
  }

  startEdit(expense: Expense): void {
    this.editingId.set(expense.id);
    this.formTitle = expense.title;
    this.formDescription = expense.description || '';
    this.formAmount = expense.amount;
    this.formCurrency = expense.currency;
    this.formDate = expense.date;
    this.formPaymentMethod = expense.paymentMethod;
    this.formStatus = expense.status;
    this.formCategoryId = expense.category.id;
    this.formReferenceCode = expense.referenceCode || '';
    this.formPeriod = expense.period || '';
    this.formReceiptUrl = expense.receiptUrl || '';
    this.formInstallmentNumber = expense.installmentNumber || null;
    this.formTotalInstallments = expense.totalInstallments || null;
    this.formIsRecurring = expense.isRecurring;
    this.formRecurrenceDay = expense.recurrenceDay || null;
    if (expense.referenceCode || expense.period || expense.receiptUrl || expense.installmentNumber) {
      this.showAdvancedFields = true;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.resetForm();
  }

  submitForm(): void {
    if (!this.formTitle.trim() || !this.formAmount || this.formAmount <= 0 || !this.formCategoryId) {
      alert('Por favor completa el concepto, un monto válido y una categoría.');
      return;
    }

    const catId = Number(this.formCategoryId);
    const inferredType = this.inferTypeFromCategory(catId);

    const payload: ExpenseRequest = {
      title: this.formTitle.trim(),
      description: this.formDescription.trim() || undefined,
      amount: this.formAmount,
      currency: this.formCurrency,
      date: this.formDate,
      expenseType: inferredType,
      paymentMethod: this.formPaymentMethod,
      status: this.formStatus,
      categoryId: catId,
      referenceCode: this.formReferenceCode.trim() || undefined,
      period: this.formPeriod.trim() || undefined,
      receiptUrl: this.formReceiptUrl.trim() || undefined,
      isRecurring: this.formIsRecurring || inferredType === 'SERVICE' || inferredType === 'SUBSCRIPTION',
      recurrenceDay: this.formRecurrenceDay || undefined,
      installmentNumber: this.formInstallmentNumber || undefined,
      totalInstallments: this.formTotalInstallments || undefined
    };

    const editId = this.editingId();
    if (editId) {
      this.api.updateExpense(editId, payload).subscribe({
        next: () => {
          this.editingId.set(null);
          this.resetForm();
          this.loadMonthData();
        },
        error: () => alert('Error al actualizar el gasto.')
      });
    } else {
      this.api.createExpense(payload).subscribe({
        next: () => {
          this.resetForm();
          this.loadMonthData();
        },
        error: () => alert('Error al registrar el gasto.')
      });
    }
  }

  toggleExpenseStatus(expense: Expense): void {
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
      next: () => this.loadMonthData()
    });
  }

  deleteExpense(id: number, event: Event): void {
    event.stopPropagation();
    if (!confirm('¿Seguro que deseas eliminar este gasto?')) return;

    this.api.deleteExpense(id).subscribe({
      next: () => this.loadMonthData()
    });
  }

  resetForm(): void {
    this.formTitle = '';
    this.formDescription = '';
    this.formAmount = null;
    this.formReferenceCode = '';
    this.formPeriod = '';
    this.formReceiptUrl = '';
    this.formInstallmentNumber = null;
    this.formTotalInstallments = null;
    this.formIsRecurring = false;
    this.formRecurrenceDay = null;
    this.syncDefaultDateToSelectedMonth();
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

  formatPaymentMethod(pm: PaymentMethod): string {
    const map: Record<PaymentMethod, string> = {
      CASH: 'Efectivo',
      DEBIT_CARD: 'Débito',
      CREDIT_CARD: 'Crédito',
      BANK_TRANSFER: 'Transferencia / DA',
      DIGITAL_WALLET: 'Billetera Virtual'
    };
    return map[pm] || pm;
  }
}
