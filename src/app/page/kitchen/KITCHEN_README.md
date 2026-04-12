# Kitchen Display System (KDS) - Frontend Documentation

## Overview

The Kitchen Display System (KDS) is a modern Angular-based frontend component designed for restaurant kitchen operations. It provides real-time order management, chef-to-waiter assignment, and visual workflow management using a Kanban-style board system.

## Features

### 1. **Real-Time Order Dashboard**
- **Live board** status indicator showing active connection
- **Order metrics** displaying:
  - Total Orders count
  - New Orders (pending)
  - Preparing Orders (in progress)
  - Ready Orders (completed)
- **Auto-refresh capability** with manual refresh button

### 2. **Kanban Board Workflow**
The system organizes orders into three columns:

#### New Orders (Blue)
- Newly received orders
- Display table number or "Takeaway"
- Shows order items summary
- Action: "Send & Start Preparing" or "Start Preparing"

#### Preparing (Amber)
- Orders currently being cooked
- Visual indicator of active preparation
- Action: "Mark as Ready"
- Drag-and-drop support for workflow management

#### Ready to Serve (Emerald)
- Completed orders awaiting pickup
- Waiter assignment section
- Display assigned waiter name
- Action: "Assign Waiter" or "Change Waiter"
- Drag-and-drop support to other columns

### 3. **Waiter Assignment System**
- Modal dialog for selecting available waiters
- Real-time waiter workload display:
  - Light Load: 0-1 orders
  - Medium Load: 2-3 orders
  - Heavy Load: 4+ orders
- Visual workload indicator bar
- Status indicator (Active/Inactive)
- Only active waiters can receive assignments

### 4. **Drag & Drop Interface**
- Drag orders between board columns
- Visual drop zone feedback with colored rings
- Move cards to:
  - **New Column**: Mark as Received
  - **Preparing Column**: Start Preparing
  - **Ready Column**: Mark as Ready
- Active drop columns highlighted during drag

### 5. **Status Feedback**
- Success messages for successful operations
- Error messages with helpful context
- Loading states during API calls
- Empty state messages when no orders exist

## Component Architecture

### Files Structure
```
kitchen/
├── kitchen.ts          # Main component logic
├── kitchen.html        # Template with Kanban board
├── kitchen.css         # Styling and animations
└── kitchen.spec.ts     # Unit tests
```

### Key Signals (Reactive State)
```typescript
orders              // All fetched orders
waiters             // Available waiter list
isLoading           // Loading state
isWaitersLoading    // Waiter list loading state
errorMessage        // Error feedback
successMessage      // Success feedback
activeOrderActionId // Currently processing order
selectedWaiterModalCardId // Selected order for waiter assignment
activeDropColumn    // Current drag-over column
```

### Computed Signals (Derived State)
```typescript
newCards           // Orders in New status
preparingCards     // Orders in Preparing status
readyCards         // Orders in Ready status
totalOrdersCount   // Total active orders
waiterAssignmentOptions // Computed waiter availability
```

## API Integration

### Endpoints Used

#### Order Management
- `GET /kitchen/orders` - Fetch all kitchen orders
- `GET /kitchen/open-orders` - Get open orders
- `POST /kitchen/send` - Send order to kitchen
- `PUT /api/order/update/{orderId}/status` - Update order status
- `GET /api/order/find-by-id/{id}` - Get order details

#### Waiter Management
- `GET /kitchen/waiters` - Fetch available waiters
- `POST /kitchen/assignments` - Get waiter assignments
- `POST /kitchen/assign` - Assign waiter to order

### Service Integration
```typescript
KitchenService
├── getDashboardOrders()    // Main data fetch
├── getWaiters()            // Waiter list
├── sendToKitchen()         // Send order to kitchen
├── updateOrderStatus()     // Update order status
└── assignWaiterWithFallback() // Assign waiter to order
```

## User Workflows

### For Chefs

1. **Receiving Orders**
   - New orders appear in "New Orders" column
   - Each card shows table number and item list
   - Review order details

2. **Starting Preparation**
   - Click "Send & Start Preparing" for new orders
   - Or drag order to "Preparing" column
   - Order moves to middle column with amber background

3. **Marking Ready**
   - When items are prepared, click "Mark as Ready"
   - Or drag order to "Ready to Serve" column
   - Order moves to final column with emerald background

### For Waiters (via Kitchen Display)

1. **Picking up Orders**
   - View all items in "Ready to Serve" column
   - Chef assigns waiter via modal
   - Waiter name displays on order card

2. **Workload Visibility**
   - See how many orders each waiter has
   - Workload bar shows at a glance
   - Status shows if waiter is active

## Styling & UX

### Color Scheme
- **Blue** (#3b82f6): New/pending orders
- **Amber** (#f59e0b): In-progress preparation
- **Emerald** (#10b981): Ready for pickup
- **Red/Rose** (#dc2626): Errors and important alerts

### Typography
- **Headings**: Semibold 16-24px
- **Body**: Regular 14px
- **Labels**: Medium 12px
- **Small text**: Regular 11px

### Responsive Design
- **Desktop (1280px+)**: 3-column layout (New | Preparing | Ready)
- **Tablet (768px-1279px)**: 2-column layout
- **Mobile (<768px)**: Single column with tabs

### Animations
- **Card entrance**: 300ms slide-in animation
- **Button interactions**: Smooth hover effects with shadow
- **Workload bars**: Smooth width transitions (300ms)
- **Modal**: 200ms fade-in
- **Drag & drop**: Real-time visual feedback

## Performance Considerations

### Optimization Techniques
1. **Change Detection Strategy**: OnPush for better performance
2. **Computed Signals**: Automatic memoization prevents unnecessary recalculations
3. **Track Function**: Efficient list rendering with `trackOrder()`
4. **Lazy Loading**: Non-critical features lazy-loaded
5. **Service Caching**: Kitchen service manages local cache for ready orders

### State Management
- **Reactive Signals**: Fine-grained reactivity
- **Computed Values**: Derived state automatically updated
- **No RxJS Subscriptions in Template**: All subscriptions managed in component

## Error Handling

### Common Errors
1. **Failed to load kitchen orders**
   - Occurs when API fails
   - User sees error message and can retry via "Refresh"

2. **Failed to assign waiter**
   - Occurs when waiter assignment fails
   - User can retry immediately or select different waiter

3. **Failed to update order status**
   - Occurs during status transitions
   - Automatic retry available

### Error Display
- Toast-like messages at top of screen
- Auto-dismiss after user interaction
- Clear, actionable error messages

## Accessibility Features

- **ARIA Labels**: Proper semantic HTML
- **Role Attributes**: Dialog role for modals
- **Focus Management**: Keyboard navigation support
- **Color Contrast**: WCAG compliant text colors
- **Screen Reader Support**: Descriptive labels throughout

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Future Enhancements

1. **Audio Alerts**: Sound notification when new orders arrive
2. **Order Recall**: Search and retrieve previous orders
3. **Estimated Times**: Show prep time estimates
4. **Multi-Station Support**: Separate views by station (grill, fryer, etc.)
5. **Analytics Dashboard**: Daily order metrics and staff performance
6. **Mobile App**: Dedicated mobile app for tablet displays
7. **Real-time Sync**: WebSocket integration for instant updates
8. **Order Notes**: Special instructions display and management
9. **Quality Control**: Chef sign-off and verification workflow
10. **Kitchen Station Assignment**: Assign orders to specific kitchen stations

## Testing

### Unit Tests Location
- [kitchen.spec.ts](kitchen.spec.ts)

### Test Coverage
- Component initialization
- Signal state management
- Computed value calculations
- Drag & drop interactions
- API integration calls
- Modal open/close functionality
- Waiter assignment logic

### Running Tests
```bash
ng test
```

## Development Guidelines

### Adding New Features
1. Update signals if state changes
2. Add corresponding HTML for new UI
3. Update CSS for styling
4. Add unit tests for logic
5. Update this documentation

### Code Style
- Use TypeScript strict mode
- Follow Angular style guide
- Use Prettier for formatting
- Provide JSDoc comments for public methods

## Support & Troubleshooting

### Common Issues

**Q: Orders not appearing on board?**
A: Click "Refresh" button or check backend API connectivity

**Q: Waiter assignment not working?**
A: Ensure waiter is marked as "Active" in system

**Q: Drag & drop not working?**
A: Ensure browser supports HTML5 drag & drop API

**Q: Performance degradation?**
A: Clear browser cache and refresh page

## Configuration

### API Endpoint
Update in `src/environments/environment.ts`:
```typescript
apiUrl: 'http://localhost:8080'
```

### Auto-Refresh Interval
Currently manual refresh only. To add auto-refresh, modify `kitchen.ts`:
```typescript
// Add to ngOnInit()
interval(5000).subscribe(() => this.refreshBoard());
```

## License

Part of Restaurant ERP system - Proprietary

---

**Last Updated**: April 7, 2026
**Version**: 1.0.0
**Status**: Production Ready ✓
