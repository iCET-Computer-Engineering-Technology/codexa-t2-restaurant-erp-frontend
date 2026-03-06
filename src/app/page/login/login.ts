import { Component } from '@angular/core';
import { RouterOutlet } from "../../../../node_modules/@angular/router/types/_router_module-chunk";

@Component({
  selector: 'app-login',
  imports: [RouterOutlet],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {

  navigateToDashboard() {
    window.location.href = '/dashboard';
  }

}
