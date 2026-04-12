import { Injectable, NgZone, inject } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
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
  private client: Client | null = null;

  readonly updates$: Observable<KitchenRealtimeEvent> = this.updatesSubject.asObservable();
  readonly connection$: Observable<boolean> = this.connectionSubject.asObservable();

  connect(): void {
    if (this.client) {
      return;
    }

    const client = new Client({
      brokerURL: this.resolveWebSocketUrl(),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: () => undefined,
    });

    client.onConnect = () => {
      this.zone.run(() => this.connectionSubject.next(true));
      client.subscribe('/topic/kds-updates', (message: IMessage) => {
        const payload = this.parseMessage(message.body);
        if (!payload) {
          return;
        }

        this.zone.run(() => {
          this.updatesSubject.next(payload);
        });
      });
    };

    client.onStompError = (frame) => {
      this.zone.run(() => this.connectionSubject.next(false));
      console.error('KDS websocket error:', frame.headers['message'], frame.body);
    };

    client.onWebSocketError = (event) => {
      this.zone.run(() => this.connectionSubject.next(false));
      console.error('KDS websocket transport error:', event);
    };

    client.onWebSocketClose = () => {
      this.zone.run(() => this.connectionSubject.next(false));
    };

    client.activate();
    this.client = client;
  }

  disconnect(): void {
    if (!this.client) {
      return;
    }

    void this.client.deactivate();
    this.client = null;
    this.connectionSubject.next(false);
  }

  private resolveWebSocketUrl(): string {
    const apiUrl = new URL(environment.apiUrl, window.location.origin);
    const protocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${apiUrl.host}/ws/websocket`;
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
}