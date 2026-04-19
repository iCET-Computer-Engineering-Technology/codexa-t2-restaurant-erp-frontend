# WebSocket Real-Time Kitchen Dashboard Integration Guide

## Overview
This guide explains how the WebSocket real-time functionality works to display orders in real-time on the kitchen dashboard.

## Architecture

### Backend (Spring Boot)
- **WebSocket Endpoint**: `/ws` (configured in `WebSocketConfig`)
- **Message Broker**: Simple in-memory STOMP broker with `/topic` prefix
- **Kitchen Topic**: `/topic/kds-updates`

### Frontend (Angular)
- **WebSocket Service**: `KitchenRealtimeService` - Handles STOMP/WebSocket connections
- **Kitchen Component**: Listens to real-time events and updates the dashboard
- **Kitchen Service**: Communicates with REST API

## Real-Time Event Flow

### 1. Initial Connection
```
Kitchen Component
    ↓
ngOnInit() → connectRealtimeUpdates()
    ↓
KitchenRealtimeService.connect()
    ↓
Establish WebSocket connection to /ws
    ↓
Subscribe to /topic/kds-updates
```

### 2. Event Reception
```
Backend sends message to /topic/kds-updates
    ↓
KitchenRealtimeService receives message
    ↓
Parse JSON payload
    ↓
Emit to updatesSubject
    ↓
Kitchen Component processes event
```

### 3. Event Types

#### KDS_ORDERS_SNAPSHOT
- **Trigger**: Full board refresh needed
- **Payload**: Complete list of all kitchen orders
- **Handler**: `applySnapshotIfAvailable()` - Updates entire orders list

#### NEW_KDS_ORDER
- **Trigger**: New order sent to kitchen
- **Payload**: New kitchen order details
- **Handler**: Board reload

#### KDS_ITEM_STATUS_UPDATE
- **Trigger**: Order item status changes (pending → fired → ready)
- **Payload**: Order item ID, new status, kitchen order ID
- **Handler**: Board reload

#### KDS_ORDERS_SNAPSHOT (Periodic)
- **Trigger**: Broadcast after any kitchen action
- **Payload**: Current state of all orders in kitchen
- **Handler**: Determines if snapshot applies, otherwise reload

## Configuration

### Environment Setup
File: `src/environments/environment.ts`
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
  wsUrl: 'http://localhost:8080'  // WebSocket base URL
};
```

### Example Values
- **Local Development**: 
  - REST API: `http://localhost:8080/api`
  - WebSocket: `http://localhost:8080/ws`

- **Production**: Update with your production URLs

## Service Implementation

### KitchenRealtimeService
Located: `src/app/services/kitchen-realtime.service.ts`

Key methods:
- `connect()`: Establishes WebSocket connection
- `disconnect()`: Closes WebSocket connection
- `isConnected()`: Returns connection status

Observables:
- `updates$`: Emits `KitchenRealtimeEvent` objects
- `connection$`: Emits connection status (true/false)

### Kitchen Component Integration
Located: `src/app/page/kitchen/kitchen.ts`

Connection flow:
1. `ngOnInit()` calls `connectRealtimeUpdates()`
2. Subscribes to connection status
3. Subscribes to real-time updates
4. Processes snapshots or reloads board

## Message Format

### From Backend
Example KDS_ORDERS_SNAPSHOT:
```json
{
  "event": "KDS_ORDERS_SNAPSHOT",
  "orders": [
    {
      "id": 1,
      "orderNumber": "ORD-001",
      "status": "pending",
      "tableId": 5,
      "waiterId": 1,
      "items": [
        {
          "id": 10,
          "menuItemName": "Pad Thai",
          "quantity": 2,
          "status": "pending"
        }
      ]
    }
  ],
  "timestamp": "2024-01-15T10:30:45"
}
```

Example NEW_KDS_ORDER:
```json
{
  "event": "NEW_KDS_ORDER",
  "kdsOrderId": 5,
  "orderNumber": "ORD-005",
  "itemCount": 3,
  "timestamp": "2024-01-15T10:30:45"
}
```

## Debugging

### Enable Debug Logging
Debug logs are automatically enabled in development mode. Check browser console for `[KitchenWS]` prefixed messages.

Sample logs:
```
[KitchenWS] Attempting to connect to WebSocket at http://localhost:8080/ws...
[KitchenWS] Connected to WebSocket server successfully.
[KitchenWS] Subscribing to topic: /topic/kds-updates
[KitchenWS] Received event 'KDS_ORDERS_SNAPSHOT' (orders=5).
[Kitchen] WebSocket connected, loading initial board and waiters...
[Kitchen] Applied snapshot with 5 orders
```

### Common Issues

#### Connection Failed
- **Symptom**: WebSocket shows "Connection Failed"
- **Solution**: 
  - Check backend is running on port 8080
  - Verify `wsUrl` in environment.ts
  - Check CORS settings in `WebSocketConfig`
  - Browser console should show detailed error

#### Orders Not Updating
- **Symptom**: Board shows orders but doesn't update in real-time
- **Solution**:
  - Check WebSocket connection status (console logs)
  - Verify backend is sending messages to `/topic/kds-updates`
  - Check if `KitchenRealtimeService` is connected
  - Browser console should show received events

#### High Memory Usage
- **Symptom**: App becomes slow after running for a while
- **Solution**:
  - WebSocket connections are auto-cleaned on component destroy
  - Verify `ngOnDestroy()` is properly unsubscribing
  - Check for memory leaks in browser DevTools

## Performance Considerations

1. **Message Frequency**: Backend sends full snapshot on each change
   - Keeps frontend simple
   - May send redundant data for large boards
   - Consider optimizing for high-volume scenarios

2. **Connection Pooling**: Each client gets its own connection
   - Multiple instances will create separate connections
   - Consider single connection shared across app if needed

3. **Data Normalization**: Frontend normalizes all message data
   - Ensures consistent state regardless of source
   - Adds minimal processing overhead

## Testing WebSocket Connection

### Manual Test (Browser DevTools)
1. Open Kitchen dashboard
2. Open browser DevTools → Console
3. Look for `[KitchenWS]` and `[Kitchen]` logs
4. Should see: "Connected to WebSocket server successfully"
5. Create a new order from POS
6. Console should show: "Received event 'KDS_ORDERS_SNAPSHOT'"
7. Dashboard should update automatically

### Backend Test
Use `postman` or `curl` to test REST endpoints:
```bash
# Send order to kitchen
curl -X POST http://localhost:8080/api/kitchen/send?orderId=1

# Update order status
curl -X POST http://localhost:8080/api/order/update/1/status?status=ready
```

## Future Enhancements

1. **Selective Updates**: Send only changed orders instead of full snapshot
2. **Order Animations**: Add animations for new orders or status changes
3. **Offline Support**: Queue local changes when offline
4. **Multi-Workspace**: Support multiple kitchen displays on separate screens
5. **Sound Alerts**: Audio notification for new orders

## Troubleshooting Checklist

- [ ] Backend WebSocket endpoint is accessible at `/ws`
- [ ] Frontend `wsUrl` in environment.ts points to correct server
- [ ] Browser DevTools shows WebSocket connection established
- [ ] Console shows `[KitchenWS]` debug messages
- [ ] CORS configured to allow WebSocket connections
- [ ] Kitchen component's `connectRealtimeUpdates()` is being called
- [ ] Messages are being received (check console logs)
- [ ] Orders are being displayed after update
- [ ] No JavaScript errors in console

## Related Files

- `src/environments/environment.ts` - Configuration
- `src/app/services/kitchen-realtime.service.ts` - WebSocket service
- `src/app/page/kitchen/kitchen.ts` - Kitchen component
- `package.json` - Dependencies (@stomp/stompjs, sockjs-client)
