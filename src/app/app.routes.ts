import { Routes } from '@angular/router';
import { Login } from './page/login/login';
import { Dashboard } from './page/dashboard/dashboard';

import { Customers } from './page/customers/customers';
import { MarketingCampaign } from './page/admin/marketing-campaign/marketing-campaign';
import { CampaignsComponent } from './page/admin/marketing-campaign/campaigns/campaigns';
import { AnalyticsComponent } from './page/admin/marketing-campaign/analytics/analytics';
import { Kitchen } from './page/kitchen/kitchen';
import { MenuCategories } from './page/menu-categories/menu-categories';
import { MenuItemPrice } from './page/menu-item-price/menu-item-price';
import { Portions } from './page/portions/portions';

import { MenuItem } from './page/menu-item/menu-item';
import { Suppliers } from './page/supplier/supplier';
import { SupplierIngredient } from './page/supplier-ingredient/supplier-ingredient';

import { OrderPlacementComponent } from './page/order-placement/order-placement.component';
import { ReservationsComponent } from './page/reservations/reservations';
import { roleGuard } from './guards/role.guard';
import { RevenueService } from './services/revenue.service';
import { Revenue } from './page/revenue/revenue';
export const routes: Routes = [
  {
    path: '',
    component: Login,
  },
  {
    path: 'dashboard',
    canActivate: [roleGuard],
    component: Dashboard,
  },
  {
    path: 'cashier',
    canActivate: [roleGuard],
    data: { roles: ['ROLE_ADMIN', 'ROLE_CASHIER'] },
    loadComponent: () => import('./page/cashier/cashier').then((m) => m.Cashier),
    children: [
      {
        path: '',
        component: OrderPlacementComponent,
      },
      {
        path: 'cashier-customer',
        component: Customers,
      },
      {
        path: "reservations",
        component: ReservationsComponent
      }
    ]
  },
  {
    path: 'waiter',
    canActivate: [roleGuard],
    data: { roles: ['ROLE_ADMIN', 'ROLE_CASHIER', 'ROLE_WAITER'] },
    loadComponent: () => import('./page/waiter/waiter').then((m) => m.Waiter),
  },
  {
    path: 'chef',
    canActivate: [roleGuard],
    data: { roles: ['ROLE_ADMIN', 'ROLE_CHEF'] },
    loadComponent: () => import('./page/chef/chef').then((m) => m.Chef),
    children: [
      {
        path: '',
        component: Kitchen,
      }
    ]
  },
  {
    path: 'admin',
    canActivate: [roleGuard],
    data: { roles: ['ROLE_ADMIN'] },
    loadComponent: () => import('./page/admin/admin').then((m) => m.Admin),
    children: [
      {
        path: '',
        component: Dashboard,
      },
      {
        path: 'admin-supplier',
        component: Suppliers
      },
      {
        path: 'admin-customer',
        component: Customers,
      },
      {
        path: 'admin-order',
        component: OrderPlacementComponent,
      },
      {
        path: 'admin-dashboard',
        component: Dashboard,
      },
      {
        path: 'menu-item',
        component: MenuItem
      },
      {
        path: "menu-item-prices",
        component: MenuItemPrice
      },
      {
        path: "menu-categories",
        component: MenuCategories
      },
      {
        path: "portions",
        component: Portions
      },
      {
        path: "reservations",
        component: ReservationsComponent
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
        ]
      },
      {
        path: 'kitchen',
        component: Kitchen,
      },
      {
        path: 'supplier-ingredient',
        component: SupplierIngredient
      },
      {
        path: 'revenue',
        component: Revenue
      }
    ],
  },
];
