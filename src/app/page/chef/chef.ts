import { Component, AfterViewInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { Notify } from '../notify/notify';

@Component({
  selector: 'app-chef',
  imports: [Sidebar, RouterOutlet, Notify],
  templateUrl: './chef.html',
  styleUrl: './chef.css',
})
export class Chef implements AfterViewInit {
  ngAfterViewInit() {
    // Initialize Flowbite components after view is rendered
    import('flowbite').then((module) => {
      if (module.initFlowbite) {
        module.initFlowbite();
      }
    }).catch(err => console.error('Error loading Flowbite:', err));
  }
}
