import { AfterViewInit, ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { Notify } from '../notify/notify';

@Component({
  selector: 'app-admin',
  imports: [Sidebar, RouterOutlet, Notify],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Admin implements AfterViewInit {
  ngAfterViewInit() {
    // Initialize Flowbite components after view is rendered
    import('flowbite').then((module) => {
      if (module.initFlowbite) {
        module.initFlowbite();
      }
    }).catch(err => console.error('Error loading Flowbite:', err));
  }
}
