import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Expense, Category, ExpenseSummary } from '../models/expense.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  // URL base: /api/v1 (en docker se proxifica con nginx o se usa localhost:8080)
  private baseUrl = '/api/v1';

  checkHealth(): Observable<{ status: string; service: string }> {
    return this.http.get<{ status: string; service: string }>(`${this.baseUrl}/health`);
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.baseUrl}/categories`);
  }

  getExpenses(year?: number, month?: number): Observable<Expense[]> {
    const params: Record<string, string> = {};
    if (year) params['year'] = year.toString();
    if (month) params['month'] = month.toString();
    return this.http.get<Expense[]>(`${this.baseUrl}/expenses`, { params });
  }

  getMonthlySummary(year?: number, month?: number): Observable<ExpenseSummary> {
    const params: Record<string, string> = {};
    if (year) params['year'] = year.toString();
    if (month) params['month'] = month.toString();
    return this.http.get<ExpenseSummary>(`${this.baseUrl}/expenses/summary`, { params });
  }
}
