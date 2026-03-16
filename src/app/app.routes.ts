import { Routes } from '@angular/router';
import { Login } from './page/login/login';
import { Dashboard } from './page/dashboard/dashboard';
import { Items } from './page/items/items';
import { PortionSize } from './page/portion-size/portion-size';
import { Category } from './page/category/category';

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
        path: "portionSize",
        component: PortionSize
    },
    {
        path: "category",
        component: Category
    }
];
