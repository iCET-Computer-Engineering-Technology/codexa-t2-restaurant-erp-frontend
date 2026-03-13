import { Component } from '@angular/core';
import { KitchenOrderTable } from "./kitchen-order-table/kitchen-order-table";
import { RouterLink, RouterOutlet } from "@angular/router";
import { Dashboard } from "../dashboard/dashboard";
import { KitchenDashboard } from "./kitchen-dashboard/kitchen-dashboard";

@Component({
  selector: 'app-kitchen',
  imports: [KitchenOrderTable, RouterLink, Dashboard, KitchenDashboard, RouterOutlet],
  templateUrl: './kitchen.html',
  styleUrl: './kitchen.css',
})
export class Kitchen {

}
