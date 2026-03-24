import { Routes } from '@angular/router';
import { Login } from './page/login/login';
import { Dashboard } from './page/dashboard/dashboard';
import { Customers } from './page/customers/customers';
import { MarketingCampaign } from './page/admin/marketing-campaign/marketing-campaign';
import { CampaignsComponent } from './page/admin/marketing-campaign/campaigns/campaigns';
import { AutomatedMessagesComponent } from './page/admin/marketing-campaign/automated-messages/automated-messages';
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
  },

  {
    path: 'manager',
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
            component: AutomatedMessagesComponent,
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
