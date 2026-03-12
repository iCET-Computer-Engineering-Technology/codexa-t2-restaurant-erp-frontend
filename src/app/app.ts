import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { initFlowbite } from 'flowbite';
import { Nav } from "./page/nav/nav";
import { Sidebar } from "./page/sidebar/sidebar";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  
  ngOnInit(): void {
    initFlowbite();
  }
  protected readonly title = signal('RestaurantERP');
}
