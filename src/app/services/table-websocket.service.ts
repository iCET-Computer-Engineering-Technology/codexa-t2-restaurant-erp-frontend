import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { TableStatusUpdateEvent } from '../models/floor-layout.model';

@Injectable({
  providedIn: 'root',
})
export class TableWebSocketService {
  private socket: WebSocket | null = null;
  private tableUpdatesSubject = new Subject<TableStatusUpdateEvent>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000; // 3 seconds
  private isIntentionallyClosed = false;

  /**
   * Connect to WebSocket server
   */
  connect(url: string = 'ws://localhost:8080/ws'): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    this.isIntentionallyClosed = false;

    try {
      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        console.log('WebSocket connected successfully');
        this.reconnectAttempts = 0;
        // Subscribe to table updates topic
        this.subscribeToTableUpdates();
      };

      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          // Handle STOMP frame
          if (message.type === 'MESSAGE' && message.destination === '/topic/table-updates') {
            const updateEvent: TableStatusUpdateEvent = JSON.parse(message.body);
            this.tableUpdatesSubject.next(updateEvent);
          } else if (message.type === 'TABLE_STATUS_UPDATE') {
            // Direct event without STOMP wrapper
            this.tableUpdatesSubject.next(message as TableStatusUpdateEvent);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.socket.onclose = () => {
        console.log('WebSocket connection closed');
        this.socket = null;

        // Auto-reconnect if not intentionally closed
        if (!this.isIntentionallyClosed && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(
            `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
          );
          setTimeout(() => this.connect(url), this.reconnectDelay);
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
    }
  }

  /**
   * Subscribe to table updates topic
   */
  private subscribeToTableUpdates(): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const subscribeMessage = JSON.stringify({
        command: 'SUBSCRIBE',
        destination: '/topic/table-updates',
        id: 'sub-0',
      });
      this.socket.send(subscribeMessage);
    }
  }

  /**
   * Get table updates as Observable
   */
  getTableUpdates(): Observable<TableStatusUpdateEvent> {
    return this.tableUpdatesSubject.asObservable();
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    this.isIntentionallyClosed = true;
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }
}
