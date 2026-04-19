import { Injectable, NgZone, inject } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { Observable, Subject } from 'rxjs';

import { environment } from '../../environments/environment';

export interface KitchenRealtimeEvent {
  event: string;
  timestamp?: string;
  [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class KitchenRealtimeService {
  private readonly zone = inject(NgZone);
  private readonly updatesSubject = new Subject<KitchenRealtimeEvent>();
  private readonly connectionSubject = new Subject<boolean>();
  private readonly debugEnabled = !environment.production;
  private readonly wsEndpoint = `${environment.wsUrl}/ws`;
  private readonly topics = ['/topic/kds-updates', '/topic/pos-updates'];
  private client: Client | null = null;
  private subscriptions: StompSubscription[] = [];
  private isConnecting = false;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 10;

  readonly updates$: Observable<KitchenRealtimeEvent> = this.updatesSubject.asObservable();
  readonly connection$: Observable<boolean> = this.connectionSubject.asObservable();

  async connect(): Promise<void> {
    if (this.client || this.isConnecting) {
      return;
    }

    this.isConnecting = true;
    this.logDebug(`Attempting to connect to WebSocket at ${this.wsEndpoint}...`);

    const scopedGlobal = globalThis as { global?: unknown };
    if (!scopedGlobal.global) {
      scopedGlobal.global = globalThis;
    }

    try {
      const sockJsModule = await import('sockjs-client');
      const SockJS = (sockJsModule.default ?? sockJsModule) as unknown as new (
        url: string,
        _reserved?: unknown,
        _options?: unknown,
      ) => WebSocket;

      const client = new Client({
        webSocketFactory: () => new SockJS(this.wsEndpoint),
        reconnectDelay: 5000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        debug: (message: string) => {
          if (this.debugEnabled) {
            console.debug('[KitchenWS]', message);
          }
        },
      });

      client.onConnect = () => {
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.logDebug('Connected to WebSocket server successfully.');
        this.zone.run(() => this.connectionSubject.next(true));

        this.unsubscribeAll();

        this.topics.forEach((topic) => {
          this.logDebug(`Subscribing to topic: ${topic}`);
          const subscription = client.subscribe(topic, (message: IMessage) => {
            const payload = this.parseMessage(message.body);
            if (!payload) {
              return;
            }

            this.logDebug(
              `Received event '${payload.event}' from ${topic} (orders=${Array.isArray(payload['orders']) ? payload['orders'].length : 0}).`,
            );

            this.zone.run(() => {
              this.updatesSubject.next(payload);
            });
          });

          this.subscriptions.push(subscription);
        });
      };

      client.onStompError = (frame) => {
        this.isConnecting = false;
        this.zone.run(() => this.connectionSubject.next(false));
        const errorMsg = frame.headers['message'] || 'Unknown error';
        console.error('[KitchenWS] STOMP error:', errorMsg);
        this.logDebug(`STOMP Error: ${errorMsg}`);
      };

      client.onWebSocketError = (event) => {
        this.isConnecting = false;
        this.zone.run(() => this.connectionSubject.next(false));
        console.error('[KitchenWS] WebSocket transport error:', event);
        this.logDebug('WebSocket transport error occurred.');
      };

      client.onWebSocketClose = () => {
        this.isConnecting = false;
        this.zone.run(() => this.connectionSubject.next(false));
        this.logDebug('WebSocket closed. Reconnect will be attempted automatically.');
      };

      client.activate();
      this.client = client;
      this.logDebug('WebSocket client activated.');
    } catch (error) {
      this.isConnecting = false;
      console.error('[KitchenWS] Failed to initialize WebSocket:', error);
      this.logDebug(`Connection failed: ${error instanceof Error ? error.message : String(error)}`);
      this.zone.run(() => this.connectionSubject.next(false));
    }
  }

  disconnect(): void {
    this.logDebug('Disconnecting WebSocket...');

    this.unsubscribeAll();

    if (!this.client) {
      return;
    }

    void this.client.deactivate();
    this.client = null;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.connectionSubject.next(false);
    this.logDebug('WebSocket disconnected.');
  }

  isConnected(): boolean {
    return this.client !== null && this.client.connected;
  }

  getConnectionStatus(): Observable<boolean> {
    return this.connectionSubject.asObservable();
  }

  private unsubscribeAll(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.subscriptions = [];
  }

  private parseMessage(body: string): KitchenRealtimeEvent | null {
    try {
      const parsed = JSON.parse(body) as unknown;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return null;
      }

      const payload = parsed as Record<string, unknown>;
      const event = payload['event'];

      if (typeof event !== 'string' || event.trim().length === 0) {
        return null;
      }

      return payload as KitchenRealtimeEvent;
    } catch {
      return null;
    }
  }

  private logDebug(message: string): void {
    if (!this.debugEnabled) {
      return;
    }

    console.debug(`[KitchenWS] ${message}`);
  }
}