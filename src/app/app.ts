import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from './services/api.service';
import { Expense, ExpenseType, Currency, PaymentMethod } from './models/expense.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private api = inject(ApiService);

  backendStatus = signal<'checking' | 'connected' | 'disconnected'>('checking');
  selectedFilter = signal<string>('ALL');

  // Datos mock iniciales listos para visualizar la UI mientras se conecta al back
  expenses = signal<Expense[]>([
    {
      id: 1,
      title: 'Supermercado Coto',
      description: 'Compra semanal de alimentos y limpieza',
      amount: 45200.50,
      currency: 'ARS',
      date: '2026-11-03',
      expenseType: 'GROCERY',
      paymentMethod: 'DEBIT_CARD',
      category: { id: 1, name: 'Supermercado y Alimentos', color: '#10B981', isSystemDefault: true },
      isRecurring: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      title: 'Factura de Electricidad (Edenor)',
      description: 'Servicio bimestral luz',
      amount: 28400.00,
      currency: 'ARS',
      date: '2026-11-01',
      expenseType: 'SERVICE',
      paymentMethod: 'BANK_TRANSFER',
      category: { id: 2, name: 'Servicios del Hogar', color: '#F59E0B', isSystemDefault: true },
      isRecurring: true,
      recurrenceDay: 10,
      createdAt: new Date().toISOString()
    },
    {
      id: 3,
      title: 'Netflix & Spotify',
      description: 'Suscripciones mensuales streaming',
      amount: 14.99,
      currency: 'USD',
      date: '2026-11-02',
      expenseType: 'SUBSCRIPTION',
      paymentMethod: 'CREDIT_CARD',
      category: { id: 3, name: 'Suscripciones Digitales', color: '#8B5CF6', isSystemDefault: true },
      isRecurring: true,
      recurrenceDay: 5,
      createdAt: new Date().toISOString()
    },
    {
      id: 4,
      title: 'Zapatillas Running (Visa)',
      description: 'Compra en 6 cuotas fijas',
      amount: 32500.00,
      currency: 'ARS',
      date: '2026-10-28',
      expenseType: 'INSTALLMENT',
      paymentMethod: 'CREDIT_CARD',
      category: { id: 4, name: 'Cuotas de Tarjeta', color: '#EF4444', isSystemDefault: true },
      installmentNumber: 2,
      totalInstallments: 6,
      isRecurring: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 5,
      title: 'Cena con amigos',
      description: 'Pizzeria y bebidas',
      amount: 18500.00,
      currency: 'ARS',
      date: '2026-11-02',
      expenseType: 'LEISURE',
      paymentMethod: 'DIGITAL_WALLET',
      category: { id: 5, name: 'Salidas y Restaurantes', color: '#EC4899', isSystemDefault: true },
      isRecurring: false,
      createdAt: new Date().toISOString()
    }
  ]);

  // Formulario rápido
  newTitle = '';
  newAmount: number | null = null;
  newCurrency: Currency = 'ARS';
  newType: ExpenseType = 'DAILY';
  newPaymentMethod: PaymentMethod = 'DEBIT_CARD';

  ngOnInit(): void {
    this.checkBackend();
  }

  checkBackend(): void {
    this.backendStatus.set('checking');
    this.api.checkHealth().subscribe({
      next: () => this.backendStatus.set('connected'),
      error: () => this.backendStatus.set('disconnected')
    });
  }

  get filteredExpenses(): Expense[] {
    const filter = this.selectedFilter();
    if (filter === 'ALL') return this.expenses();
    return this.expenses().filter(e => e.expenseType === filter);
  }

  get totalArs(): number {
    return this.expenses()
      .filter(e => e.currency === 'ARS')
      .reduce((acc, curr) => acc + curr.amount, 0);
  }

  get totalUsd(): number {
    return this.expenses()
      .filter(e => e.currency === 'USD')
      .reduce((acc, curr) => acc + curr.amount, 0);
  }

  addExpense(): void {
    if (!this.newTitle.trim() || !this.newAmount || this.newAmount <= 0) return;

    const newExp: Expense = {
      id: Date.now(),
      title: this.newTitle.trim(),
      amount: this.newAmount,
      currency: this.newCurrency,
      date: new Date().toISOString().split('T')[0],
      expenseType: this.newType,
      paymentMethod: this.newPaymentMethod,
      category: {
        id: 99,
        name: this.formatType(this.newType),
        color: '#3B82F6',
        isSystemDefault: false
      },
      isRecurring: this.newType === 'SUBSCRIPTION' || this.newType === 'SERVICE',
      createdAt: new Date().toISOString()
    };

    this.expenses.update(list => [newExp, ...list]);

    this.newTitle = '';
    this.newAmount = null;
  }

  deleteExpense(id: number): void {
    this.expenses.update(list => list.filter(e => e.id !== id));
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
}
