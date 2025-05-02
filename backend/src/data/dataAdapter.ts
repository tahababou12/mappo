import { GraphData, Entity, Relationship, RelationshipType } from '../types';

// Define the structure of the input data
interface HistoricalRecord {
  Source: string;
  Target: string;
  Event: string;
  'Start date': string;
  'End date': string;
  Location: string;
  lon: string;
  lat: string;
  'Type of action': string;
  Bibliography: string;
}

// Extract unique relationship types from the data
function extractRelationshipTypes(records: HistoricalRecord[]): Record<string, RelationshipType> {
  const uniqueActionTypes = new Set<string>();
  const actionTypeMap: Record<string, RelationshipType> = {};
  
  // Extract all non-empty action types
  records.forEach(record => {
    if (record['Type of action'] && record['Type of action'].trim()) {
      uniqueActionTypes.add(record['Type of action'].trim());
    }
  });
  
  // Map each unique action type to a relationship type
  uniqueActionTypes.forEach(actionType => {
    // Default mapping logic - can be customized based on your domain knowledge
    const lowerAction = actionType.toLowerCase();
    
    if (lowerAction.includes('writing') || lowerAction.includes('reading') || 
        lowerAction.includes('working') || lowerAction.includes('commission') || 
        lowerAction.includes('lecturing') || lowerAction.includes('studying') ||
        lowerAction.includes('painting') || lowerAction.includes('assisting')) {
      actionTypeMap[actionType] = 'professional';
    } 
    else if (lowerAction.includes('meeting') || lowerAction.includes('introduction') || 
             lowerAction.includes('talking') || lowerAction.includes('visiting') ||
             lowerAction.includes('speaking')) {
      actionTypeMap[actionType] = 'social';
    }
    else if (lowerAction.includes('viewing') || lowerAction.includes('acquires') || 
             lowerAction.includes('buying') || lowerAction.includes('sends')) {
      actionTypeMap[actionType] = 'cultural';
    }
    else {
      // Default fallback
      actionTypeMap[actionType] = 'social';
    }
  });
  
  return actionTypeMap;
}

// Convert historical records to graph data format
export function convertToGraphData(records: HistoricalRecord[]): GraphData {
  console.log(`Converting ${records.length} records to graph data`);
  
  const entities = new Map<string, Entity>();
  const relationships = new Map<string, Relationship>();
  
  // Extract relationship types dynamically from the data
  const actionToRelationshipType = extractRelationshipTypes(records);
  
  // First pass: collect all entities from both source and target
  records.forEach(record => {
    // Extract sources and targets
    if (record.Source && record.Source.trim()) {
      const sourceId = generateId(record.Source);
      if (!entities.has(sourceId)) {
        entities.set(sourceId, {
          id: sourceId,
          name: record.Source.trim(),
          type: "person", // Default to person type
          startDate: record['Start date'] || undefined,
          endDate: record['End date'] || undefined,
          description: "",
          metadata: {
            events: [] as string[],
            locations: [] as string[],
            bibliography: [] as string[]
          }
        });
      }
    }
    
    if (record.Target && record.Target.trim()) {
      const targetId = generateId(record.Target);
      if (!entities.has(targetId)) {
        entities.set(targetId, {
          id: targetId,
          name: record.Target.trim(),
          type: "person", // Default to person type
          startDate: record['Start date'] || undefined,
          endDate: record['End date'] || undefined,
          description: "",
          metadata: {
            events: [] as string[],
            locations: [] as string[],
            bibliography: [] as string[]
          }
        });
      }
    }
  });
  
  console.log(`Created ${entities.size} entities from source/target fields`);
  
  // Log the first 10 entities to verify data
  const entitySample = Array.from(entities.values()).slice(0, 10);
  console.log('Sample entities:', entitySample.map(e => e.name));
  
  // Second pass: create relationships and update entity metadata
  const totalRecords = records.length;
  
  records.forEach((record, index) => {
    // Log progress every 100 records
    if (index % 100 === 0) {
      console.log(`Processing relationships: ${index}/${totalRecords} (${((index/totalRecords)*100).toFixed(1)}%)`);
    }
    
    if (!record.Source || !record.Target) return;
    
    const sourceId = generateId(record.Source);
    const targetId = generateId(record.Target);
    
    // Skip if we don't have both entities
    if (!entities.has(sourceId) || !entities.has(targetId)) return;
    
    // Get the entities
    const sourceEntity = entities.get(sourceId)!;
    const targetEntity = entities.get(targetId)!;
    
    // Add event to metadata if not empty
    if (record.Event) {
      // Safely type-cast the arrays
      const sourceEvents = sourceEntity.metadata.events as string[];
      const targetEvents = targetEntity.metadata.events as string[];
      
      if (!sourceEvents.includes(record.Event)) {
        sourceEntity.metadata.events = [...sourceEvents, record.Event];
      }
      if (!targetEvents.includes(record.Event)) {
        targetEntity.metadata.events = [...targetEvents, record.Event];
      }
    }
    
    // Add location to metadata if not empty
    if (record.Location) {
      // Safely type-cast the arrays
      const sourceLocations = sourceEntity.metadata.locations as string[];
      const targetLocations = targetEntity.metadata.locations as string[];
      
      if (!sourceLocations.includes(record.Location)) {
        sourceEntity.metadata.locations = [...sourceLocations, record.Location];
      }
      if (!targetLocations.includes(record.Location)) {
        targetEntity.metadata.locations = [...targetLocations, record.Location];
      }
    }
    
    // Add bibliography to metadata if not empty
    if (record.Bibliography) {
      // Safely type-cast the arrays
      const sourceBibliography = sourceEntity.metadata.bibliography as string[];
      const targetBibliography = targetEntity.metadata.bibliography as string[];
      
      if (!sourceBibliography.includes(record.Bibliography)) {
        sourceEntity.metadata.bibliography = [...sourceBibliography, record.Bibliography];
      }
      if (!targetBibliography.includes(record.Bibliography)) {
        targetEntity.metadata.bibliography = [...targetBibliography, record.Bibliography];
      }
    }
    
    // Create relationship
    const relationshipId = `${sourceId}-${targetId}-${generateId(record.Event || 'unknown')}`;
    if (!relationships.has(relationshipId)) {
      const relationshipType = actionToRelationshipTypeMapping(record['Type of action'], actionToRelationshipType);
      
      relationships.set(relationshipId, {
        id: relationshipId,
        source: sourceId,
        target: targetId,
        type: relationshipType,
        startDate: record['Start date'] || undefined,
        endDate: record['End date'] || undefined,
        description: record.Event || "",
        strength: 1,
        metadata: {
          location: record.Location || "",
          bibliography: record.Bibliography || "",
          actionType: record['Type of action'] || ""
        }
      });
    }
  });
  
  // Convert maps to arrays
  const nodeArray = Array.from(entities.values());
  const linkArray = Array.from(relationships.values());
  
  // Log detailed stats
  console.log(`Created ${nodeArray.length} nodes and ${linkArray.length} links`);
  
  // Log sample of relationships to verify data
  console.log('Sample relationships:', linkArray.slice(0, 5).map(link => ({
    source: nodeArray.find(n => n.id === link.source)?.name || link.source,
    target: nodeArray.find(n => n.id === link.target)?.name || link.target,
    type: link.type
  })));
  
  // Log conversion stats
  console.log(`Converted data: ${nodeArray.length} nodes, ${linkArray.length} links`);
  
  return {
    nodes: nodeArray,
    links: linkArray
  };
}

// Helper function to generate consistent IDs from names
function generateId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '-');
}

// Helper function to map action types to relationship types
function actionToRelationshipTypeMapping(action: string, actionMap: Record<string, RelationshipType>): RelationshipType {
  const normalizedAction = action ? action.trim() : "";
  return normalizedAction && actionMap[normalizedAction] ? actionMap[normalizedAction] : "social";
}

// Sample historical data for testing/fallback
export const sampleHistoricalGraphData: GraphData = {
  nodes: [
    { id: "john-ruskin", name: "John Ruskin", type: "person", startDate: "1819-02-08", endDate: "1900-01-20", description: "English art critic and social thinker", metadata: { profession: "Writer, Critic", nationality: "English" } },
    { id: "william-wordsworth", name: "William Wordsworth", type: "person", startDate: "1770-04-07", endDate: "1850-04-23", description: "English Romantic poet", metadata: { profession: "Poet", nationality: "English" } },
    { id: "literary-society", name: "Literary Society", type: "organization", startDate: "1800", description: "Intellectual circle in Victorian England", metadata: { type: "Cultural Organization", country: "England" } },
    { id: "pre-raphaelite-brotherhood", name: "Pre-Raphaelite Brotherhood", type: "organization", startDate: "1848", description: "Group of English painters, poets, and critics", metadata: { type: "Art Movement", country: "England" } },
    { id: "london", name: "London", type: "location", description: "Capital city of England", metadata: { country: "England", type: "Capital City" } },
    { id: "lake-district", name: "Lake District", type: "location", description: "Mountainous region in North West England", metadata: { country: "England", type: "Region" } }
  ],
  links: [
    { id: "1", source: "john-ruskin", target: "william-wordsworth", type: "social", description: "Intellectual influence" },
    { id: "2", source: "john-ruskin", target: "literary-society", type: "professional", description: "Membership" },
    { id: "3", source: "john-ruskin", target: "pre-raphaelite-brotherhood", type: "professional", description: "Championed the movement" },
    { id: "4", source: "john-ruskin", target: "london", type: "social", description: "Lived and worked in" },
    { id: "5", source: "william-wordsworth", target: "lake-district", type: "social", description: "Lived and wrote about" },
    { id: "6", source: "william-wordsworth", target: "literary-society", type: "professional", description: "Influential member" }
  ]
};
