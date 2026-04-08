import {AfterViewInit, Component} from '@angular/core';
import {Sidebar} from '../sidebar/sidebar';
import {RouterOutlet} from '@angular/router';

@Component({
  selector: 'app-manager',
  standalone: true,
  imports: [
    Sidebar,
    RouterOutlet
  ],
  templateUrl: './manager.html',
  styleUrl: './manager.css',
})
export class Manager implements AfterViewInit{
  ngAfterViewInit() {
    // Initialize Flowbite components after view is rendered
    import('flowbite').then((module) => {
      if (module.initFlowbite) {
        module.initFlowbite();
      }
    }).catch(err => console.error('Error loading Flowbite:', err));
  }
}
