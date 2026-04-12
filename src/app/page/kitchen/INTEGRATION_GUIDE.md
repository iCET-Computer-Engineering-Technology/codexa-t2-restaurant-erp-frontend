# Kitchen Display System Integration Guide

## 🔗 Routing Integration

The Kitchen Display System is already integrated into the application routing:

### Route Configuration
```
/chef (Protected Route - ROLE_ADMIN or ROLE_CHEF)
  └── / (Default Child Route)
      └── Kitchen Component
```

**Location**: `src/app/app.routes.ts` (lines 53-59)

```typescript
{
  path: 'chef',
  canActivate: [roleGuard],
  data: { roles: ['ROLE_ADMIN', 'ROLE_CHEF'] },
  loadComponent: () => import('./page/chef/chef').then((m) => m.Chef),
  children: [
    {
      path: '',
      component: Kitchen,  // ✅ Kitchen Display System
    }
  ]
}
```

## 🚀 Accessing the Kitchen

### For Chefs
1. Login with role: **ROLE_CHEF**
2. Navigate to: **http://localhost:4200/chef**
3. Kitchen Display System loads automatically

### For Admins
1. Login with role: **ROLE_ADMIN**
2. Navigate to: **http://localhost:4200/admin > Chef Section > Kitchen**
3. Or directly: **http://localhost:4200/chef**

### Direct Access
- Development: `http://localhost:4200/chef`
- Production: `https://yourdomain.com/chef`

## 🔐 Security & Roles

### Role-Based Access Control
- **ROLE_CHEF**: Full access to Kitchen Display
- **ROLE_ADMIN**: Full access (can view as chef)
- **Others**: Blocked by `roleGuard`

### Guard Implementation
Located: `src/app/guards/role.guard.ts`

The guard verifies:
1. User is authenticated
2. User has required role
3. Route access is allowed

## 📡 Service Integration

### KitchenService
**Location**: `src/app/services/kitchen.service.ts`

### Integration Points

```typescript
// Import the service
import { KitchenService } from '../../services/kitchen.service';

// Inject in component
private readonly kitchenService = inject(KitchenService);

// Use key methods
this.kitchenService.getDashboardOrders()      // Get orders for display
this.kitchenService.getWaiters()              // Get waiter list
this.kitchenService.sendToKitchen(orderId)    // Send order to kitchen
this.kitchenService.updateOrderStatus(...)    // Update order status
this.kitchenService.assignWaiter(...)         // Assign waiter to order
```

## 📊 Data Flow

```
┌─────────────────────────────────────────┐
│   Backend API (Port 8080)               │
├─────────────────────────────────────────┤
│ /kitchen/orders                         │
│ /kitchen/open-orders                    │
│ /kitchen/waiters                        │
│ /kitchen/assignments                    │
│ /api/order/*                            │
└──────────────┬──────────────────────────┘
               │
               ↓
        ┌──────────────┐
        │ KitchenService
        │ (HTTP Client)
        └──────────────┘
               │
               ↓
        ┌─────────────────────────────────┐
        │ Kitchen Component               │
        ├─────────────────────────────────┤
        │ • Signals (State Management)    │
        │ • Computed (Derived State)      │
        │ • Event Handlers (User Input)   │
        └─────────────────────────────────┘
               │
               ↓
        ┌──────────────────────────────────┐
        │ Kitchen Template                 │
        ├──────────────────────────────────┤
        │ • Dashboard Metrics              │
        │ • Kanban Board (3 Columns)       │
        │ • Order Cards (Draggable)        │
        │ • Waiter Modal                   │
        └──────────────────────────────────┘
               │
               ↓
        ┌──────────────────────────────────┐
        │ User Browser Rendering           │
        ├──────────────────────────────────┤
        │ • CSS Styling (Tailwind + Custom)│
        │ • Drag & Drop Interactions       │
        │ • Modal Dialogs                  │
        └──────────────────────────────────┘
```

## 🏗️ Component Architecture

```
Kitchen Component (Standalone)
├── Imports
│   ├── CommonModule (for *ngFor, *ngIf)
│   ├── KitchenService (via inject)
│   └── Angular Core (signals, computed)
│
├── Signals (Mutable State)
│   ├── orders: Order[]
│   ├── waiters: Waiter[]
│   ├── isLoading: boolean
│   ├── errorMessage: string
│   ├── successMessage: string
│   └── selectedWaiterModalCardId: number | null
│
├── Computed (Derived State)
│   ├── newCards: Order[]
│   ├── preparingCards: Order[]
│   ├── readyCards: Order[]
│   ├── totalOrdersCount: number
│   └── waiterAssignmentOptions: WaiterAssignmentOption[]
│
├── Methods
│   ├── ngOnInit()
│   ├── ngOnDestroy()
│   ├── refreshBoard()
│   ├── moveCard()
│   ├── assignWaiter()
│   └── ... (more methods)
│
└── Template (kitchen.html)
    ├── Header (Title + Refresh Button)
    ├── Alert Messages
    ├── Metrics Dashboard
    ├── Kanban Board Columns
    └── Waiter Assignment Modal
```

## 🔄 Data Lifecycle

### On Component Initialize
1. `ngOnInit()` called
2. `refreshBoard()` loads orders
3. `getWaiters()` loads waiter list
4. Orders displayed in appropriate columns
5. Waiter options calculated for modal

### On Order Status Change
1. User clicks action button or drags card
2. `changeOrderStatus()` called
3. `kitchenService.updateOrderStatus()` executes
4. API response updates local signal
5. Template re-renders automatically (OnPush)

### On Waiter Assignment
1. User opens assignment modal
2. Selects waiter from list
3. `assignWaiterFromModal()` called
4. `kitchenService.assignWaiter()` executes
5. Order updated with waiter info
6. Modal closes, board refreshes

## 🌐 Environment Configuration

### API Base URL
**Location**: `src/environments/environment.ts`

```typescript
export const environment = {
  apiUrl: 'http://localhost:8080',  // Change for production
  // ... other config
};
```

### Production Deployment
```typescript
export const environment = {
  apiUrl: 'https://api.yourdomain.com',
  // ... other config
};
```

## 📦 Dependencies

### Angular Core
- `@angular/core` - Component, signals, lifecycle
- `@angular/common` - CommonModule, template directives
- `@angular/platform-browser` - HTTP, DOM

### RxJS
- `rxjs` - Observable, operators (tap, catchError, switchMap, etc.)

### HTTP Client
- `@angular/common/http` - HttpClient, HttpParams

## 🧪 Testing Integration

### Running Tests
```bash
npm test
```

### Test File Location
`src/app/page/kitchen/kitchen.spec.ts`

### Testing Areas
- Component initialization
- Signal state updates
- Drag & drop interactions
- API calls
- Modal functionality
- Error handling

## 📈 Performance Optimization

### Change Detection
- Strategy: **OnPush** (Explicit change detection)
- Benefits: Reduced change detection cycles, better performance

### Memoization
- Computed signals automatically memoize
- Re-evaluate only when dependencies change

### List Rendering
- Using `track` function for optimal *ngFor
- Prevents unnecessary DOM updates

## 🐛 Debugging Tips

### Enable Debug Logging
```typescript
// In kitchen.ts
console.log('Orders loaded:', this.orders());
console.log('Waiters loaded:', this.waiters());
```

### Check Network Requests
1. Open Browser DevTools (F12)
2. Go to Network tab
3. Monitor API calls to `/kitchen/*`
4. Check response status and payload

### Verify Component State
```typescript
// In browser console
// (after navigating to kitchen)
ng.getComponent(document.querySelector('app-kitchen'))
  .orders()  // See current orders
```

## 🚨 Common Issues & Solutions

### Issue: Orders not loading
**Solution**: 
- Check Network tab for API errors
- Verify backend URL in environment.ts
- Ensure user has ROLE_CHEF permission

### Issue: Waiter assignment fails
**Solution**:
- Ensure waiter status is "Active"
- Check console for error messages
- Verify kitchen service API endpoints

### Issue: Drag & drop not working
**Solution**:
- Check browser supports HTML5 drag/drop
- Verify no JavaScript errors in console
- Refresh page and try again

### Issue: Performance degradation
**Solution**:
- Clear browser cache (Ctrl+Shift+Delete)
- Restart development server
- Check for memory leaks in DevTools

## 📚 Related Documentation

- [KITCHEN_README.md](./KITCHEN_README.md) - Full feature documentation
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - What was built
- [src/app/services/kitchen.service.ts](../../services/kitchen.service.ts) - Service details
- [src/app/guards/role.guard.ts](../../guards/role.guard.ts) - Security guard

## 🎯 Next Steps

1. **Testing**: Run unit and integration tests
2. **Deployment**: Deploy to production environment
3. **Monitor**: Track performance and user feedback
4. **Enhance**: Implement future features from roadmap

---

**Last Updated**: April 7, 2026
**Version**: 1.0.0
**Status**: Ready for Integration ✅
