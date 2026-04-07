import {
  ChangeDetectionStrategy,
  Component,
  WritableSignal,
  computed,
  signal,
} from '@angular/core';

type BoardColumn = 'new' | 'preparing' | 'ready';

interface KitchenCard {
  id: string;
  orderNumber: string;
  tableLabel: string;
  summary: string;
  elapsedLabel?: string;
  progress?: number;
  waiter?: string;
}

@Component({
  selector: 'app-kitchen',
  imports: [],
  templateUrl: './kitchen.html',
  styleUrl: './kitchen.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Kitchen {
  readonly waiterOptions = ['Sachini (W-01)', 'Dinesh (W-02)', 'Kasun (W-03)'];

  readonly newCards = signal<KitchenCard[]>([
    {
      id: 'ord-1042',
      orderNumber: 'ORD-1042',
      tableLabel: 'Table 04',
      summary: '2x Grilled Chicken, 1x Fried Rice, 1x Kottu Roti',
    },
    {
      id: 'ord-1041',
      orderNumber: 'ORD-1041',
      tableLabel: 'Table 07',
      summary: '2x Devilled Prawns',
    },
  ]);

  readonly preparingCards = signal<KitchenCard[]>([
    {
      id: 'ord-1038',
      orderNumber: 'ORD-1038',
      tableLabel: 'Table 11',
      summary: 'Lamb Curry x2, Naan Bread x3',
      elapsedLabel: '14 min',
      progress: 70,
    },
    {
      id: 'ord-1037',
      orderNumber: 'ORD-1037',
      tableLabel: 'Table 03',
      summary: 'Soup x2, Biryani x2',
      elapsedLabel: '8 min',
      progress: 40,
    },
  ]);

  readonly readyCards = signal<KitchenCard[]>([
    {
      id: 'ord-1035',
      orderNumber: 'ORD-1035',
      tableLabel: 'Table 09',
      summary: 'Pasta Alfredo x1, Garlic Bread x2',
      waiter: '',
    },
    {
      id: 'ord-1034',
      orderNumber: 'ORD-1034',
      tableLabel: 'Table 06',
      summary: 'Rice and Curry x4',
      waiter: '',
    },
  ]);

  readonly totalOrdersCount = computed(
    () => this.newCards().length + this.preparingCards().length + this.readyCards().length
  );
  readonly activeDropColumn = signal<BoardColumn | null>(null);

  private readonly draggingState = signal<{ card: KitchenCard; from: BoardColumn } | null>(null);

  onDragStart(event: DragEvent, cardId: string, from: BoardColumn): void {
    const card = this.findCard(cardId, from);
    if (!card) {
      return;
    }

    this.draggingState.set({ card, from });
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', card.id);
    }
  }

  onDragOver(event: DragEvent, to: BoardColumn): void {
    event.preventDefault();
    const dragging = this.draggingState();
    if (!dragging) {
      return;
    }

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }

    if (dragging.from !== to) {
      this.activeDropColumn.set(to);
    }
  }

  onDragLeave(column: BoardColumn): void {
    if (this.activeDropColumn() === column) {
      this.activeDropColumn.set(null);
    }
  }

  onDrop(event: DragEvent, to: BoardColumn): void {
    event.preventDefault();
    this.activeDropColumn.set(null);

    const dragging = this.draggingState();
    if (!dragging) {
      return;
    }

    this.moveInternal(dragging.card.id, dragging.from, to);
    this.draggingState.set(null);
  }

  onDragEnd(): void {
    this.activeDropColumn.set(null);
    this.draggingState.set(null);
  }

  moveCard(cardId: string, from: BoardColumn, to: BoardColumn): void {
    this.moveInternal(cardId, from, to);
  }

  updateReadyWaiter(cardId: string, waiter: string): void {
    this.readyCards.update((cards) =>
      cards.map((card) => (card.id === cardId ? { ...card, waiter } : card))
    );
  }

  private moveInternal(cardId: string, from: BoardColumn, to: BoardColumn): void {
    if (from === to) {
      return;
    }

    const card = this.findCard(cardId, from);
    if (!card) {
      return;
    }

    this.getColumnSignal(from).update((cards) => cards.filter((item) => item.id !== cardId));
    this.getColumnSignal(to).update((cards) => [...cards, this.normalizeCardForColumn(card, to)]);
  }

  private normalizeCardForColumn(card: KitchenCard, to: BoardColumn): KitchenCard {
    const normalized: KitchenCard = {
      id: card.id,
      orderNumber: card.orderNumber,
      tableLabel: card.tableLabel,
      summary: card.summary,
    };

    if (to === 'preparing') {
      return {
        ...normalized,
        elapsedLabel: card.elapsedLabel ?? 'Now',
        progress: card.progress ?? 35,
      };
    }

    if (to === 'ready') {
      return {
        ...normalized,
        waiter: card.waiter ?? '',
      };
    }

    return normalized;
  }

  private findCard(cardId: string, from: BoardColumn): KitchenCard | undefined {
    return this.getColumnSignal(from)().find((card) => card.id === cardId);
  }

  private getColumnSignal(column: BoardColumn): WritableSignal<KitchenCard[]> {
    switch (column) {
      case 'new':
        return this.newCards;
      case 'preparing':
        return this.preparingCards;
      case 'ready':
        return this.readyCards;
      default:
        return this.newCards;
    }
  }

}
