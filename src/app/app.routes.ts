import { Routes } from '@angular/router';
import { Login } from './page/login/login';
import { Dashboard } from './page/dashboard/dashboard';
import { Kitchen } from './page/kitchen/kitchen';
import { KitchenOrderTable } from './page/kitchen/kitchen-order-table/kitchen-order-table';
import { KitchenDashboard } from './page/kitchen/kitchen-dashboard/kitchen-dashboard';
import { OrderAssign } from './page/kitchen/order-assign/order-assign';

export const routes: Routes = [
  {
    path: '',
    component: Login,
  },
  {
    path: 'dashboard',
    component: Dashboard,
  },
  {
    path: 'kitchen',
    component: Kitchen,

    children: [
      {
        path: '',
        redirectTo: 'kitchen-dashboard',
        pathMatch: 'full',
      },
      {
        path: 'kitchen-dashboard',
        component: KitchenDashboard,
      },
      {
        path: 'kitchen-order-table',
        component: KitchenOrderTable,
      },
      {
        path: 'order-assign',
        component: OrderAssign,
      },
    ],
  },
];
