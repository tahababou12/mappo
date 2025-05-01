import { GraphData, Entity, Relationship, EntityType, RelationshipType } from '../types';

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

// Map action types to relationship types
const actionToRelationshipType = (action: string): RelationshipType => {
  const actionLower = action.toLowerCase();
  
  if (actionLower.includes('writing') || actionLower.includes('letter')) {
    return 'professional';
  } else if (actionLower.includes('meeting') || actionLower.includes('visit')) {
    return 'social';
  } else if (actionLower.includes('family') || actionLower.includes('marriage')) {
    return 'family';
  } else if (actionLower.includes('political') || actionLower.includes('election')) {
    return 'political';
  } else if (actionLower.includes('conflict') || actionLower.includes('dispute')) {
    return 'conflict';
  }
  
  // Default to professional if no match
  return 'professional';
};

// Determine entity type (simplified for demo)
const determineEntityType = (name: string): EntityType => {
  // This is a simplified approach - in a real application, you would have more sophisticated logic
  // or a predefined mapping of entities to types
  
  // For demo purposes, we'll consider entities with common location names as locations
  const locationKeywords = ['london', 'paris', 'york', 'edinburgh', 'rydal'];
  if (locationKeywords.some(keyword => name.toLowerCase().includes(keyword))) {
    return 'location';
  }
  
  // For demo purposes, consider entities with organization keywords as organizations
  const orgKeywords = ['society', 'association', 'club', 'university', 'college', 'school'];
  if (orgKeywords.some(keyword => name.toLowerCase().includes(keyword))) {
    return 'organization';
  }
  
  // For demo purposes, consider entities with event keywords as events
  const eventKeywords = ['war', 'battle', 'conference', 'exhibition', 'meeting'];
  if (eventKeywords.some(keyword => name.toLowerCase().includes(keyword))) {
    return 'event';
  }
  
  // Default to person
  return 'person';
};

// Convert historical records to graph data
export const convertToGraphData = (records: HistoricalRecord[]): GraphData => {
  const entities = new Map<string, Entity>();
  const relationships = new Map<string, Relationship>();
  
  // Process each record
  records.forEach((record, index) => {
    // Process source entity
    if (!entities.has(record.Source)) {
      entities.set(record.Source, {
        id: record.Source,
        name: record.Source,
        type: determineEntityType(record.Source),
        metadata: {}
      });
    }
    
    // Process target entity
    if (!entities.has(record.Target)) {
      entities.set(record.Target, {
        id: record.Target,
        name: record.Target,
        type: determineEntityType(record.Target),
        metadata: {}
      });
    }
    
    // Create relationship
    const relationshipId = `rel-${index}`;
    const relationshipType = actionToRelationshipType(record['Type of action']);
    
    relationships.set(relationshipId, {
      id: relationshipId,
      source: record.Source,
      target: record.Target,
      type: relationshipType,
      startDate: record['Start date'],
      endDate: record['End date'],
      description: record.Event,
      strength: 1 // Default strength
    });
    
    // Update entity metadata with location information if available
    if (record.Location) {
      const sourceEntity = entities.get(record.Source);
      if (sourceEntity) {
        sourceEntity.metadata.locations = sourceEntity.metadata.locations 
          ? `${sourceEntity.metadata.locations}, ${record.Location}`
          : record.Location;
      }
      
      const targetEntity = entities.get(record.Target);
      if (targetEntity) {
        targetEntity.metadata.locations = targetEntity.metadata.locations 
          ? `${targetEntity.metadata.locations}, ${record.Location}`
          : record.Location;
      }
    }
    
    // Add bibliography information to relationship
    if (record.Bibliography) {
      const relationship = relationships.get(relationshipId);
      if (relationship) {
        relationship.metadata = relationship.metadata || {};
        relationship.metadata.bibliography = record.Bibliography;
      }
    }
  });
  
  return {
    nodes: Array.from(entities.values()),
    links: Array.from(relationships.values())
  };
};

// Sample data based on the provided structure
export const sampleHistoricalRecords: HistoricalRecord[] = [
  {
    Source: "Aitchison",
    Target: "John Ruskin",
    Event: "In the memorial for Ruskin after his death presented to Dean and Chapter of Westminster Abbey",
    "Start date": "1900-01-25",
    "End date": "1900-01-25",
    Location: "London, England",
    lon: "51.507222",
    lat: "-0.1275",
    "Type of action": "Writing",
    Bibliography: "The Complete Works of John Ruskin"
  },
  {
    Source: "Arthur Sullivan",
    Target: "John Ruskin",
    Event: "In the memorial for Ruskin after his death presented to Dean and Chapter of Westminster Abbey",
    "Start date": "1900-01-25",
    "End date": "1900-01-25",
    Location: "London, England",
    lon: "51.507222",
    lat: "-0.1275",
    "Type of action": "Writing",
    Bibliography: "The Complete Works of John Ruskin"
  },
  {
    Source: "Atkinson",
    Target: "William Wordsworth",
    Event: "Atkinson wrote to Wordsworth asking for a contribution to a volume of poetry",
    "Start date": "1845-05-25",
    "End date": "1845-05-25",
    Location: "Rydal, England",
    lon: "54.4488",
    lat: "-2.9984",
    "Type of action": "Writing",
    Bibliography: "Wordsworth and His Circle"
  },
  {
    Source: "Bancroft",
    Target: "William Wordsworth",
    Event: "Bancroft visited Wordsworth's home",
    "Start date": "1848-08-01",
    "End date": "1848-08-01",
    Location: "Rydal, England",
    lon: "54.4488",
    lat: "-2.9984",
    "Type of action": "Meeting",
    Bibliography: "Wordsworth and His Circle"
  },
  {
    Source: "Bronson Alcott",
    Target: "William Wordsworth",
    Event: "Alcott called in Wordsworth home, but he wasn't there",
    "Start date": "1849-08-01",
    "End date": "1849-08-01",
    Location: "Rydal, England",
    lon: "54.4488",
    lat: "-2.9984",
    "Type of action": "Meeting",
    Bibliography: "Wordsworth and His Circle"
  },
  {
    Source: "Bronson Alcott",
    Target: "William Wordsworth",
    Event: "Alcott delivered to Wordsworth Elizabeth Peabody's letter",
    "Start date": "1842-05-07",
    "End date": "1842-05-07",
    Location: "Rydal, England",
    lon: "54.4488",
    lat: "-2.9984",
    "Type of action": "Meeting",
    Bibliography: "Wordsworth and His Circle"
  },
  {
    Source: "Charles Dickens",
    Target: "William Wordsworth",
    Event: "Dickens and Wordsworth met at a literary dinner",
    "Start date": "1843-06-12",
    "End date": "1843-06-12",
    Location: "London, England",
    lon: "51.507222",
    lat: "-0.1275",
    "Type of action": "Meeting",
    Bibliography: "Literary London"
  },
  {
    Source: "John Keats",
    Target: "William Wordsworth",
    Event: "Keats met Wordsworth at Haydon's dinner party",
    "Start date": "1817-12-28",
    "End date": "1817-12-28",
    Location: "London, England",
    lon: "51.507222",
    lat: "-0.1275",
    "Type of action": "Meeting",
    Bibliography: "Keats and His Circle"
  },
  {
    Source: "Samuel Taylor Coleridge",
    Target: "William Wordsworth",
    Event: "Coleridge and Wordsworth collaborated on Lyrical Ballads",
    "Start date": "1798-01-01",
    "End date": "1798-12-31",
    Location: "Somerset, England",
    lon: "51.1051",
    lat: "-2.9260",
    "Type of action": "Writing",
    Bibliography: "Coleridge and Wordsworth: A Lyrical Friendship"
  },
  {
    Source: "Dorothy Wordsworth",
    Target: "William Wordsworth",
    Event: "Dorothy kept journals of their daily life and travels",
    "Start date": "1800-01-01",
    "End date": "1803-12-31",
    Location: "Lake District, England",
    lon: "54.4609",
    lat: "-3.0886",
    "Type of action": "Family",
    Bibliography: "The Grasmere Journals"
  },
  {
    Source: "Ralph Waldo Emerson",
    Target: "Thomas Carlyle",
    Event: "Emerson visited Carlyle at his home in Scotland",
    "Start date": "1833-08-26",
    "End date": "1833-08-26",
    Location: "Craigenputtock, Scotland",
    lon: "55.1644",
    lat: "-3.8661",
    "Type of action": "Meeting",
    Bibliography: "The Correspondence of Emerson and Carlyle"
  },
  {
    Source: "John Stuart Mill",
    Target: "Thomas Carlyle",
    Event: "Mill accidentally burned the manuscript of Carlyle's 'The French Revolution'",
    "Start date": "1835-03-06",
    "End date": "1835-03-06",
    Location: "London, England",
    lon: "51.507222",
    lat: "-0.1275",
    "Type of action": "Conflict",
    Bibliography: "Carlyle: A Biography"
  },
  {
    Source: "Charles Dickens",
    Target: "John Forster",
    Event: "Dickens appointed Forster as his literary executor",
    "Start date": "1869-05-12",
    "End date": "1869-05-12",
    Location: "London, England",
    lon: "51.507222",
    lat: "-0.1275",
    "Type of action": "Professional",
    Bibliography: "The Life of Charles Dickens"
  },
  {
    Source: "Elizabeth Barrett",
    Target: "Robert Browning",
    Event: "Barrett and Browning exchanged letters before meeting",
    "Start date": "1845-01-10",
    "End date": "1845-05-20",
    Location: "London, England",
    lon: "51.507222",
    lat: "-0.1275",
    "Type of action": "Writing",
    Bibliography: "The Courtship of Robert Browning and Elizabeth Barrett"
  },
  {
    Source: "Elizabeth Barrett",
    Target: "Robert Browning",
    Event: "Barrett and Browning married secretly",
    "Start date": "1846-09-12",
    "End date": "1846-09-12",
    Location: "London, England",
    lon: "51.507222",
    lat: "-0.1275",
    "Type of action": "Family",
    Bibliography: "The Barretts of Wimpole Street"
  }
];

// Generate graph data from sample records
export const sampleHistoricalGraphData = convertToGraphData(sampleHistoricalRecords);
