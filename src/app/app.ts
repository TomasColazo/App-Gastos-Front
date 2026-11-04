import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { ApiService } from './services/api.service';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private api = inject(ApiService);
  protected auth = inject(AuthService);

  backendStatus = signal<'checking' | 'connected' | 'disconnected'>('checking');

  ngOnInit(): void {
    this.auth.ensureAuthenticated().subscribe({
      next: (ok) => {
        if (ok) {
          this.backendStatus.set('connected');
        } else {
          this.checkHealthFallback();
        }
      },
      error: () => this.checkHealthFallback()
    });
  }

  private checkHealthFallback(): void {
    this.api.checkHealth().subscribe({
      next: () => this.backendStatus.set('connected'),
      error: () => this.backendStatus.set('disconnected')
    });
  }
}
