# WebSocket Real-Time Implementation - Quick Reference

## What Was Changed

### 1. Environment Configuration
**File**: `src/environments/environment.ts`
- Added `wsUrl: 'http://localhost:8080'` configuration
- This allows easy switching between environments (dev, staging, prod)

### 2. WebSocket Service Enhancement
**File**: `src/app/services/kitchen-realtime.service.ts`

**Improvements**:
- Uses environment configuration instead of hardcoded URL
- Added comprehensive debug logging
- Better error handling with try-catch
- New methods:
  - `isConnected()` - Check connection status
  - `getConnectionStatus()` - Observable for connection status
- Reconnection tracking (up to 10 attempts)

### 3. Kitchen Component Logging
**File**: `src/app/page/kitchen/kitchen.ts`

**Added**:
- Debug logging in `connectRealtimeUpdates()`
- Logs connection status changes
- Logs received events
- Helps troubleshoot real-time updates

## How It Works (Step by Step)

### Order Creation Flow
```
1. Order placed on POS/Tablet
2. Backend receives order
3. Backend creates KitchenOrder and notifies via WebSocket
4. Frontend receives KDS_ORDERS_SNAPSHOT
5. Kitchen dashboard updates automatically
```

### Real-Time Message Flow
```
Backend (Spring WebSocket)
    ↓
Publishes to /topic/kds-updates
    ↓
Frontend STOMP Client subscribes
    ↓
Message received in KitchenRealtimeService
    ↓
Parsed and emitted to updates$
    ↓
Kitchen Component receives event
    ↓
Dashboard re-renders with new data
```

## Testing Steps

### 1. Start Development Environment
```bash
# Terminal 1: Angular Frontend
npm start
# Serves on http://localhost:4200

# Terminal 2: Spring Backend  
# Should be running on http://localhost:8080
```

### 2. Verify WebSocket Connection
1. Open Kitchen dashboard: `http://localhost:4200`
2. Open Browser DevTools → Console
3. Should see logs like:
   ```
   [KitchenWS] Attempting to connect to WebSocket at http://localhost:8080/ws...
   [KitchenWS] Connected to WebSocket server successfully.
   [KitchenWS] Subscribing to topic: /topic/kds-updates
   [Kitchen] WebSocket connected, loading initial board and waiters...
   ```

### 3. Test Real-Time Updates
1. Use POS/Tablet to create a new order
2. Check Kitchen dashboard console for:
   ```
   [KitchenWS] Received event 'KDS_ORDERS_SNAPSHOT' (orders=5).
   [Kitchen] Applied snapshot with 5 orders
   ```
3. New order should appear on dashboard automatically

### 4. Test Status Updates
1. Drag order from "New" → "Preparing" or "Ready"
2. Console should show board reload
3. Backend should receive status update
4. WebSocket should broadcast snapshot

## Common Console Messages (Normal)

✅ **Expected messages** (nothing to worry about):
```
[KitchenWS] Attempting to connect to WebSocket...
[KitchenWS] Connected to WebSocket server successfully.
[Kitchen] WebSocket connected, loading initial board...
[KitchenWS] Received event 'KDS_ORDERS_SNAPSHOT'...
[Kitchen] Applied snapshot with X orders
```

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| WebSocket won't connect | Backend not running | Check backend is on port 8080 |
| Connection shows "false" | Network error | Check firewall, CORS settings |
| Orders not updating | No WebSocket connection | Check browser console logs |
| Blank board | API call failed | Check kitchen/orders endpoint |
| High memory usage | Memory leak | Check component cleanup in ngOnDestroy |

## Key Configuration Values

| Setting | Value | File |
|---------|-------|------|
| WebSocket Endpoint | /ws | Kitchen Component |
| Topic | /topic/kds-updates | KitchenRealtimeService |
| Reconnect Delay | 5000ms | KitchenRealtimeService |
| Heartbeat In | 10000ms | KitchenRealtimeService |
| Heartbeat Out | 10000ms | KitchenRealtimeService |
| API Base URL | http://localhost:8080/api | environment.ts |
| WebSocket Base URL | http://localhost:8080 | environment.ts |

## Next Steps

### For Development
1. ✅ WebSocket service is configured
2. ✅ Kitchen component listens to events
3. Next → Test with actual backend events

### For Production
1. Update environment.ts with production URLs
2. Disable debug logging (set production: true in environment)
3. Test WebSocket on production server
4. Monitor WebSocket connection stability

### For Optimization (Future)
1. Implement selective updates (only changed orders)
2. Add order animations
3. Add sound alerts for new orders
4. Support multiple kitchen displays

## Debugging Commands

### Browser Console
```javascript
// Check if service is available
console.log(ng.probe(document.querySelector('app-kitchen')).injector.get(KitchenRealtimeService));

// Get WebSocket status
ng.probe(document.querySelector('app-kitchen')).injector.get(KitchenRealtimeService).isConnected();
```

### Network Tab (DevTools)
- Look for WebSocket connection to `localhost:8080/ws`
- Should show `101 Web Socket Protocol Handshake`
- Messages should show on "Messages" subtab

## Quick Checklist Before Going Live

- [ ] Backend WebSocket endpoint is working
- [ ] Frontend connects without errors
- [ ] Orders appear on dashboard
- [ ] Orders update in real-time
- [ ] No console errors
- [ ] Mobile/Tablet works (if applicable)
- [ ] Performance is acceptable
- [ ] Reconnection works when connection drops

## Support & Troubleshooting

For detailed troubleshooting:
1. Check `WEBSOCKET_REALTIME_GUIDE.md` for comprehensive guide
2. Check browser console for `[KitchenWS]` logs
3. Check backend logs for WebSocket activity
4. Verify environment configuration
5. Test with simple curl/postman commands
