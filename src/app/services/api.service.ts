import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Expense, Category, ExpenseSummary, ExpenseRequest, ExpenseType } from '../models/expense.model';

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

  getExpenses(year?: number, month?: number, type?: ExpenseType): Observable<Expense[]> {
    const params: Record<string, string> = {};
    if (year) params['year'] = year.toString();
    if (month) params['month'] = month.toString();
    if (type) params['type'] = type;
    return this.http.get<Expense[]>(`${this.baseUrl}/expenses`, { params });
  }

  getMonthlySummary(year?: number, month?: number): Observable<ExpenseSummary> {
    const params: Record<string, string> = {};
    if (year) params['year'] = year.toString();
    if (month) params['month'] = month.toString();
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
