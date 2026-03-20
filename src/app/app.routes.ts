import { Routes } from '@angular/router';
import { Login } from './page/login/login';
import { Dashboard } from './page/dashboard/dashboard';
import { Portions } from './page/portions/portions';
import { MenuItemPrice } from './page/menu-item-price/menu-item-price';
import { MenuCategories } from './page/menu-categories/menu-categories';
import { MenuItems } from './page/menu-items/menu-items';

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
        path: "menu-items",
        component: MenuItems
    },
    {
        path: "portions",
        component: Portions
    },
    {
        path: "menu-categories",
        component: MenuCategories
    },
    {
        path: "menu-item-price",
        component: MenuItemPrice
    }
];
