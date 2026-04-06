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
import {BasicSalary} from './page/manager/basic-salary/basic-salary';
import {Allowance} from './page/manager/allowance/allowance';
import {Deduction} from './page/manager/deduction/deduction';
import {Employee} from './page/manager/employee/employee';
import {EmployeeLeave} from './page/manager/employee-leave/employee-leave';
import {Overtime} from './page/manager/overtime/overtime';
import {PayrollConfig} from './page/manager/payroll-config/payroll-config';
import {Payroll} from './page/manager/payroll/payroll';
import {SalaryRequest} from './page/manager/salary-request/salary-request';
import {SalaryResponse} from './page/manager/salary-response/salary-response';
import {Bonus} from './page/manager/bonus/bonus';
import { MenuCategories } from './page/menu-categories/menu-categories';
import { MenuItemPrice } from './page/menu-item-price/menu-item-price';
import { Portions } from './page/portions/portions';

import { MenuItem } from './page/menu-item/menu-item';
import { Suppliers } from './page/supplier/supplier';
import { SupplierIngredient } from './page/supplier-ingredient/supplier-ingredient';

import { OrderPlacementComponent } from './page/order-placement/order-placement.component';
import { ReservationsComponent } from './page/reservations/reservations';
import { roleGuard } from './guards/role.guard';

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
    path: 'manager',
    canActivate: [roleGuard],
    data: { roles: ['ROLE_ADMIN', 'ROLE_MANAGER'] },
    loadComponent: () => import('./page/manager/manager').then((m) => m.Manager),
    children: [
          {
            path: 'manager-dashboard',
            component: Dashboard,
          },
          {
            path: '',
            pathMatch:"full",
            redirectTo:'manager-dashboard'
          },
          {
            path: 'admin-dashboard',
            pathMatch:"full",
            redirectTo:'manager-dashboard'
          },
          {
            path: 'manager-allowance',
            component: Allowance,
          },
          {
            path: 'manager-basic-salary',
            component: BasicSalary
          },
          {
            path: 'manager-deduction',
            component: Deduction
          },
          {
            path: 'manager-employee',
            component: Employee
          },
          {
            path: 'manager-employee-leave',
            component: EmployeeLeave
          },
          {
            path: 'manager-overtime',
            component: Overtime
          },
          {
            path: 'manager-payroll-config',
            component: PayrollConfig
          },
          {
            path: 'manager-payroll',
            component: Payroll
          },
          {
            path: 'manager-bonus',
            component: Bonus
          },
          {
            path: 'manager-salary-request',
            component: SalaryRequest
          },
          {
            path: 'manager-salary-response',
            component: SalaryResponse
          },
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
        component: KitchenDashboard,
      },
      {
        path: 'kitchen-oder-table',
        component: KitchenOrderTable,
      },
      {
        path: 'order-assign',
        component: OrderAssign,
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
          }
        ],
      },
      {
        path: 'supplier-ingredient',
        component: SupplierIngredient
      },
      {
        path: 'manager-allowance',
        component: Allowance,
      },
      {
        path: 'manager-basic-salary',
        component: BasicSalary
      },
      {
        path: 'manager-deduction',
        component: Deduction
      },
      {
        path: 'manager-employee',
        component: Employee
      },
      {
        path: 'manager-employee-leave',
        component: EmployeeLeave
      },
      {
        path: 'manager-overtime',
        component: Overtime
      },
      {
        path: 'manager-payroll-config',
        component: PayrollConfig
      },
      {
        path: 'manager-payroll',
        component: Payroll
      },
      {
        path: 'manager-bonus',
        component: Bonus
      },
      {
        path: 'manager-salary-request',
        component: SalaryRequest
      },
      {
        path: 'manager-salary-response',
        component: SalaryResponse
      }
    ],
  },
];
