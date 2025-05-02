export type EntityType = 'person' | 'organization' | 'event' | 'location';
export type RelationshipType = 'family' | 'professional' | 'social' | 'political' | 'conflict' | 'cultural';

export interface Entity {
  id: string;
  name: string;
  type: EntityType;
  startDate?: string;
  endDate?: string;
  description?: string;
  location?: string;
  lon?: number;
  lat?: number;
  metadata: Record<string, string | number | boolean | string[]>;
}

export interface Relationship {
  id: string;
  source: string;
  target: string;
  type: RelationshipType;
  startDate?: string;
  endDate?: string;
  description?: string;
  strength?: number;
  metadata?: Record<string, string | number | boolean | string[] | undefined>;
}

export interface GraphData {
  nodes: Entity[];
  links: Relationship[];
}

// These interfaces are needed for types that support the graph data processing
export interface SimulationNodeDatum {
  index?: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface SimulationLinkDatum {
  source: string | SimulationNodeDatum;
  target: string | SimulationNodeDatum;
  index?: number;
} 