import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {

  navigateToDashboard() {
    window.location.href = '/dashboard';
  }

}
