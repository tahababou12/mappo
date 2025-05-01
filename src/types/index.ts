export type EntityType = 'person' | 'organization' | 'event' | 'location';
export type RelationshipType = 'family' | 'professional' | 'social' | 'political' | 'conflict';
export type LayoutType = 'force' | 'radial' | 'hierarchical';

export interface Entity {
  id: string;
  name: string;
  type: EntityType;
  startDate?: string;
  endDate?: string;
  description?: string;
  metadata: Record<string, string | number | boolean>;
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
  metadata?: Record<string, string | number | boolean>;
}

export interface GraphData {
  nodes: Entity[];
  links: Relationship[];
}

export interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  type: EntityType;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  id: string;
  source: string | GraphNode;
  target: string | GraphNode;
  type: RelationshipType;
  strength?: number;
}

export interface FilterState {
  entityTypes: Record<EntityType, boolean>;
  relationshipTypes: Record<RelationshipType, boolean>;
  timeRange: [number, number];
  showCommunities: boolean;
  layout: LayoutType;
  nodeSizeAttribute: string;
}

export interface SearchResult {
  id: string;
  name: string;
  type: EntityType;
  matchScore: number;
}

export interface QueryResult {
  text: string;
  entities: string[];
  relationships: string[];
}
