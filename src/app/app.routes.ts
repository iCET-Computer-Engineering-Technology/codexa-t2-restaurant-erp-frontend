import { Routes } from '@angular/router';
import { Login } from './page/login/login';
import { Dashboard } from './page/dashboard/dashboard';
import { Customers } from './page/customers/customers';
import { MarketingCampaign } from './page/admin/marketing-campaign/marketing-campaign';
import { CampaignsComponent } from './page/admin/marketing-campaign/campaigns/campaigns';
import { AnalyticsComponent } from './page/admin/marketing-campaign/analytics/analytics';
import { Kitchen } from './page/kitchen/kitchen';
import { KitchenDashboard } from './page/kitchen/kitchen-dashboard/kitchen-dashboard';
import { KitchenOrderTable } from './page/kitchen/kitchen-order-table/kitchen-order-table';
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
    path: 'cashier',
    loadComponent: () => import('./page/cashier/cashier').then((m) => m.Cashier),
    children: [
      {
        path: '',
        component: Dashboard,
      }
    ]
  },
  {
    path: 'waiter',
    loadComponent: () => import('./page/waiter/waiter').then((m) => m.Waiter),
  },
  {
    path: 'chef',
    loadComponent: () => import('./page/chef/chef').then((m) => m.Chef),
  },
  {
    path: 'admin',
    loadComponent: () => import('./page/admin/admin').then((m) => m.Admin),
    children: [
      {
        path: '',
        component: Dashboard,
      },
      {
        path: 'admin-customer',
        component: Customers,
      },
      {
        path: 'admin-dashboard',
        component: Dashboard,
      },
      {
        path: 'admin-marketing',
        component: MarketingCampaign,
        children: [
          {
            path: 'campaigns',
            component: CampaignsComponent,
          },
          {
            path: 'automated-messages',
            loadComponent: () =>
              import('./page/admin/marketing-campaign/automated-messages').then(
                (m) => m.AutomatedMessagesComponent
              ),
          },
          {
            path: 'analytics',
            component: AnalyticsComponent,
          },
        ],
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
    ],
  },
];