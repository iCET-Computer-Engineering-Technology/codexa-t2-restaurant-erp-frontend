import { Routes } from '@angular/router';
import { Login } from './page/login/login';
import { Dashboard } from './page/dashboard/dashboard';
import { Customers } from './page/customers/customers';
import { MarketingCampaign } from './page/admin/marketing-campaign/marketing-campaign';
import { CampaignsComponent } from './page/admin/marketing-campaign/campaigns/campaigns';
import { AutomatedMessagesComponent } from './page/admin/marketing-campaign/automated-messages/automated-messages';
import { AnalyticsComponent } from './page/admin/marketing-campaign/analytics/analytics';
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
            },
            {
                path: 'admin-marketing',
                component: MarketingCampaign,
                children:[
                    {
                        path: 'campaigns',
                        component: CampaignsComponent
                    },
                    {
                        path: 'automated-messages',
                        component: AutomatedMessagesComponent
                    },
                    {
                        path: 'analytics',
                        component: AnalyticsComponent
                    }
                ]
            }
        ]
    },
];
