import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from "../sidebar/sidebar";

@Component({
  selector: 'app-cashier',
  imports: [Sidebar, RouterOutlet],
  templateUrl: './cashier.html',
  styleUrl: './cashier.css',
})
export class Cashier {

}
