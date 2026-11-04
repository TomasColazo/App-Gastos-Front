import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Expense, Category, ExpenseSummary, ExpenseRequest, ExpenseFilterParams } from '../models/expense.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = '/api/v1';

  checkHealth(): Observable<{ status: string; service: string }> {
    return this.http.get<{ status: string; service: string }>(`${this.baseUrl}/health`);
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.baseUrl}/categories`);
  }

  getExpenses(filters?: ExpenseFilterParams): Observable<Expense[]> {
    const params: Record<string, string> = {};
    if (filters) {
      if (filters.year) params['year'] = filters.year.toString();
      if (filters.month) params['month'] = filters.month.toString();
      if (filters.startDate) params['startDate'] = filters.startDate;
      if (filters.endDate) params['endDate'] = filters.endDate;
      if (filters.categoryId) params['categoryId'] = filters.categoryId.toString();
      if (filters.type) params['type'] = filters.type;
      if (filters.status) params['status'] = filters.status;
      if (filters.currency) params['currency'] = filters.currency;
      if (filters.paymentMethod) params['paymentMethod'] = filters.paymentMethod;
      if (filters.search && filters.search.trim()) params['search'] = filters.search.trim();
    }
    return this.http.get<Expense[]>(`${this.baseUrl}/expenses`, { params });
  }

  getMonthlySummary(year: number, month: number): Observable<ExpenseSummary> {
    const params: Record<string, string> = {
      year: year.toString(),
      month: month.toString()
    };
    return this.http.get<ExpenseSummary>(`${this.baseUrl}/expenses/summary`, { params });
  }

  createExpense(expense: ExpenseRequest): Observable<Expense> {
    return this.http.post<Expense>(`${this.baseUrl}/expenses`, expense);
  }

  updateExpense(id: number, expense: ExpenseRequest): Observable<Expense> {
    return this.http.put<Expense>(`${this.baseUrl}/expenses/${id}`, expense);
  }

  deleteExpense(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/expenses/${id}`);
  }
}
