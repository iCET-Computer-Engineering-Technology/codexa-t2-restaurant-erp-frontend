import { RouterModule, Routes } from '@angular/router';
import { Login } from './page/login/login';
import { Dashboard } from './page/dashboard/dashboard';
import { Customers } from './page/customers/customers';
import { NgModule } from '@angular/core';
export const routes: Routes = [
    {
        path: '',
        component: Login
    },
    {
        path: 'dashboard',

        component: Dashboard
    },
    {
        path: 'cashier',
        loadComponent: () => import('./page/cashier/cashier').then(m => m.Cashier)
    },
    {
        path: 'waiter',
        loadComponent: () => import('./page/waiter/waiter').then(m => m.Waiter)
    },
    {
        path: 'chef',
        loadComponent: () => import('./page/chef/chef').then(m => m.Chef)
    },
    {
        path: 'admin',
        loadComponent: () => import('./page/admin/admin').then(m => m.Admin),
        children:[
            {
                path: '',
                component:Dashboard
            },
            {
                path: 'admin-customer',
                component: Customers
            },
            {
                path: 'admin-dashboard',
                component: Dashboard
            }
        ]
    },
];
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
