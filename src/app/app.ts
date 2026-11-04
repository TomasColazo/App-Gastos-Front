import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from './services/api.service';
import { AuthService } from './services/auth.service';
import { Expense, Category, ExpenseType, Currency, PaymentMethod, ExpenseStatus, ExpenseRequest } from './models/expense.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private api = inject(ApiService);
  protected auth = inject(AuthService);

  backendStatus = signal<'checking' | 'connected' | 'disconnected'>('checking');
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  // Filtros
  selectedFilter = signal<string>('ALL');
  statusFilter = signal<'ALL' | 'PAID' | 'PENDING'>('ALL');

  // Datos
  categories = signal<Category[]>([]);
  expenses = signal<Expense[]>([]);

  // Formulario reactivo
  newTitle = '';
  newDescription = '';
  newAmount: number | null = null;
  newCurrency: Currency = 'ARS';
  newDate: string = new Date().toISOString().split('T')[0];
  newType: ExpenseType = 'SERVICE';
  newPaymentMethod: PaymentMethod = 'DEBIT_CARD';
  newStatus: ExpenseStatus = 'PAID';
  newCategoryId: number | null = null;
  newReferenceCode = '';
  newPeriod = '';
  newReceiptUrl = '';
  newInstallmentNumber: number | null = null;
  newTotalInstallments: number | null = null;
  newIsRecurring = false;
  newRecurrenceDay: number | null = null;

  // Toggle para campos avanzados
  showAdvancedFields = false;

  ngOnInit(): void {
    this.initApp();
  }

  initApp(): void {
    this.backendStatus.set('checking');
    this.auth.ensureAuthenticated().subscribe({
      next: (authenticated) => {
        if (authenticated) {
          this.backendStatus.set('connected');
          this.loadCategories();
          this.loadExpenses();
        } else {
          this.backendStatus.set('disconnected');
          this.errorMessage.set('No se pudo autenticar con el backend.');
        }
      },
      error: () => {
        this.backendStatus.set('disconnected');
        this.errorMessage.set('El backend no responde en /api/v1.');
      }
    });
  }

  loadCategories(): void {
    this.api.getCategories().subscribe({
      next: (cats) => {
        this.categories.set(cats);
        if (cats.length > 0 && !this.newCategoryId) {
          this.newCategoryId = cats[0].id;
        }
      },
      error: (err) => console.error('Error al cargar categorías:', err)
    });
  }

  loadExpenses(): void {
    this.isLoading.set(true);
    this.api.getExpenses().subscribe({
      next: (data) => {
        this.expenses.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar gastos:', err);
        this.isLoading.set(false);
      }
    });
  }

  get filteredExpenses(): Expense[] {
    return this.expenses().filter((e) => {
      // Filtro por tipo
      const matchesType = this.selectedFilter() === 'ALL' || e.expenseType === this.selectedFilter();
      // Filtro por estado
      const matchesStatus = this.statusFilter() === 'ALL' || e.status === this.statusFilter();
      return matchesType && matchesStatus;
    });
  }

  get totalArs(): number {
    return this.expenses()
      .filter((e) => e.currency === 'ARS')
      .reduce((acc, curr) => acc + Number(curr.amount), 0);
  }

  get totalUsd(): number {
    return this.expenses()
      .filter((e) => e.currency === 'USD')
      .reduce((acc, curr) => acc + Number(curr.amount), 0);
  }

  get totalPendingCount(): number {
    return this.expenses().filter((e) => e.status === 'PENDING').length;
  }

  submitExpense(): void {
    if (!this.newTitle.trim() || !this.newAmount || this.newAmount <= 0 || !this.newCategoryId) {
      alert('Por favor completa el título, un monto válido y selecciona una categoría.');
      return;
    }

    const payload: ExpenseRequest = {
      title: this.newTitle.trim(),
      description: this.newDescription.trim() || undefined,
      amount: this.newAmount,
      currency: this.newCurrency,
      date: this.newDate,
      expenseType: this.newType,
      paymentMethod: this.newPaymentMethod,
      status: this.newStatus,
      categoryId: this.newCategoryId,
      referenceCode: this.newReferenceCode.trim() || undefined,
      period: this.newPeriod.trim() || undefined,
      receiptUrl: this.newReceiptUrl.trim() || undefined,
      isRecurring: this.newIsRecurring || this.newType === 'SERVICE' || this.newType === 'SUBSCRIPTION',
      recurrenceDay: this.newRecurrenceDay || undefined,
      installmentNumber: this.newInstallmentNumber || undefined,
      totalInstallments: this.newTotalInstallments || undefined
    };

    this.api.createExpense(payload).subscribe({
      next: (created) => {
        this.expenses.update((list) => [created, ...list]);
        this.resetForm();
      },
      error: (err) => {
        console.error('Error al guardar gasto:', err);
        alert('Error al guardar en PostgreSQL. Revisa los datos ingresados.');
      }
    });
  }

  deleteExpense(id: number, event: Event): void {
    event.stopPropagation();
    if (!confirm('¿Seguro que deseas eliminar este registro?')) return;

    this.api.deleteExpense(id).subscribe({
      next: () => {
        this.expenses.update((list) => list.filter((e) => e.id !== id));
      },
      error: (err) => console.error('Error al eliminar gasto:', err)
    });
  }

  toggleExpenseStatus(expense: Expense): void {
    const updatedStatus: ExpenseStatus = expense.status === 'PAID' ? 'PENDING' : 'PAID';
    const payload: ExpenseRequest = {
      title: expense.title,
      description: expense.description,
      amount: expense.amount,
      currency: expense.currency,
      date: expense.date,
      expenseType: expense.expenseType,
      paymentMethod: expense.paymentMethod,
      status: updatedStatus,
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
        this.expenses.update((list) =>
          list.map((e) => (e.id === expense.id ? updated : e))
        );
      },
      error: (err) => console.error('Error al actualizar estado:', err)
    });
  }

  resetForm(): void {
    this.newTitle = '';
    this.newDescription = '';
    this.newAmount = null;
    this.newReferenceCode = '';
    this.newPeriod = '';
    this.newReceiptUrl = '';
    this.newInstallmentNumber = null;
    this.newTotalInstallments = null;
    this.newIsRecurring = false;
    this.newRecurrenceDay = null;
  }

  formatType(type: ExpenseType): string {
    const map: Record<ExpenseType, string> = {
      DAILY: 'Gasto Diario',
      GROCERY: 'Supermercado',
      SERVICE: 'Servicios',
      SUBSCRIPTION: 'Suscripción',
      INSTALLMENT: 'Cuota Tarjeta',
      LEISURE: 'Salidas / Ocio',
      HEALTH: 'Salud',
      TRANSPORT: 'Transporte',
      OTHER: 'Otro'
    };
    return map[type] || type;
  }

  formatPaymentMethod(pm: PaymentMethod): string {
    const map: Record<PaymentMethod, string> = {
      CASH: 'Efectivo',
      DEBIT_CARD: 'Tarjeta Débito',
      CREDIT_CARD: 'Tarjeta Crédito',
      BANK_TRANSFER: 'Transferencia / DA',
      DIGITAL_WALLET: 'Billetera Virtual'
    };
    return map[pm] || pm;
  }
}
