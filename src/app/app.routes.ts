import { RouterModule, Routes } from '@angular/router';
import { Login } from './page/login/login';
import { Dashboard } from './page/dashboard/dashboard';
import { Table } from './page/table/table';
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
        path: 'table',
        component: Table
    }
    
];
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
