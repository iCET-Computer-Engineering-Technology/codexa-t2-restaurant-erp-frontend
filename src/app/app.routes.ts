import { Routes } from '@angular/router';
import { Login } from './page/login/login';
import { Dashboard } from './page/dashboard/dashboard';
import { Items } from './page/items/items';
import { Category } from './page/category/category';
import { Portions } from './page/portions/portions';

export const routes: Routes = [
    {
        path: '',
        component: Login
    },
    {
        path: 'dashboard',
        component: Dashboard,
    },
    {
        path: "items",
        component: Items
    },
    {
        path: "portions",
        component: Portions
    },
    {
        path: "category",
        component: Category
    }
];
