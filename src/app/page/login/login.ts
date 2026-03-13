import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [CommonModule, RouterOutlet],
  templateUrl: './login.html',
  styleUrl: './login.css',
  standalone: true
})
export class Login {

  navigateToDashboard() {
    window.location.href = '/dashboard';
  }

}
