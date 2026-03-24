import { Component } from '@angular/core';
import { Sidebar } from "../sidebar/sidebar";
import { TableReservation } from "./table-reservation/table-reservation";

@Component({
  selector: 'app-cashier',
  imports: [Sidebar, TableReservation],
  templateUrl: './cashier.html',
  styleUrl: './cashier.css',
})
export class Cashier {

}
