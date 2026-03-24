import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';

@Component({
  selector: 'app-chef',
  imports: [Sidebar, RouterOutlet],
  templateUrl: './chef.html',
  styleUrl: './chef.css',
})
export class Chef {

}
