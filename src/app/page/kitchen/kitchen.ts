import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from "@angular/router";
import { Sidebar } from "../sidebar/sidebar";

@Component({
  selector: 'app-kitchen',
  imports: [RouterLink, RouterOutlet, Sidebar],
  templateUrl: './kitchen.html',
  styleUrl: './kitchen.css',
})
export class Kitchen {

}
