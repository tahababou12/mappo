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

// Frontend specific types for graph visualization
export interface GraphNode extends Entity {
  x?: number;
  y?: number;
  z?: number;
  vx?: number;
  vy?: number;
  vz?: number;
  fx?: number | null;
  fy?: number | null;
  fz?: number | null;
  index?: number;
}

export interface GraphLink {
  id: string;
  source: string | GraphNode;
  target: string | GraphNode;
  type: RelationshipType;
  startDate?: string;
  endDate?: string;
  description?: string;
  strength?: number;
  metadata?: Record<string, string | number | boolean | string[] | undefined>;
  index?: number;
}

// Filter state interface
export interface FilterState {
  entityTypes: {
    person: boolean;
    organization: boolean;
    event: boolean;
    location: boolean;
  };
  relationshipTypes: {
    family: boolean;
    professional: boolean;
    social: boolean;
    political: boolean;
    conflict: boolean;
    cultural: boolean;
  };
  timeRange: [number, number];
  showCommunities: boolean;
  layout: 'force' | 'hierarchical' | 'circular';
  nodeSizeAttribute: 'degree' | 'betweenness' | 'pagerank';
}

// Search result interface
export interface SearchResult {
  entity: Entity;
  score: number;
  matchedFields: string[];
}

// Entity relationship interface for details panel
export interface EntityRelationship {
  entity: Entity;
  relationship: Relationship;
} 