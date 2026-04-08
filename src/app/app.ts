import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { initFlowbite } from 'flowbite';
import { ToastContainerComponent } from './components/toast-container/toast-container.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainerComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  
  ngOnInit(): void {
    initFlowbite();
  }
  protected readonly title = signal('RestaurantERP');
}
