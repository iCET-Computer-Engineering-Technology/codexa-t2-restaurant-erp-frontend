export interface FloorSection {
  id: number;
  name: string;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TablePosition {
  id: number;
  tableNumber: string;
  capacity: number;
  sectionId: number | null;
  posX: number | null;
  posY: number | null;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  updatedAt?: string;
}

export interface TableWithPosition extends TablePosition {
  sectionName?: string;
}

export interface FloorLayoutResponse {
  sections: FloorSection[];
  tables: TablePosition[];
}

export interface UpdateLayoutRequest {
  tables: Array<{
    id: number;
    sectionId: number | null;
    posX: number | null;
    posY: number | null;
  }>;
}

export interface TableStatusUpdateEvent {
  type: 'TABLE_STATUS_UPDATE';
  tableId: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  timestamp: string;
}

export interface CreateSectionRequest {
  name: string;
  displayOrder?: number;
}

export interface UpdateSectionRequest {
  name?: string;
  displayOrder?: number;
}
