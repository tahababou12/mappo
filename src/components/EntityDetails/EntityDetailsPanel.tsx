import React from 'react';
import {
  Box,
  Heading,
  Text,
  Divider,
  Badge,
  List,
  ListItem,
  Flex,
  Button,
  useColorMode,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import { X, ExternalLink, MapPin, Book, Calendar } from 'lucide-react';
import { Entity, Relationship, EntityType } from '../../types';
import theme from '../../theme';

interface EntityDetailsPanelProps {
  entity: Entity | null;
  relationships: {
    entity: Entity;
    relationship: Relationship;
  }[];
  onClose: () => void;
  onSelectEntity: (entityId: string) => void;
  onExpandNeighborhood: (entityId: string) => void;
}

const EntityDetailsPanel: React.FC<EntityDetailsPanelProps> = ({
  entity,
  relationships,
  onClose,
  onSelectEntity,
  onExpandNeighborhood,
}) => {
  const { colorMode } = useColorMode();

  if (!entity) {
    return null;
  }

  // Format dates for display
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Unknown';
    
    // If it's just a year
    if (dateStr.length === 4) return dateStr;
    
    // If it's a full date
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      // Log error or handle differently if needed
      console.warn(`Could not parse date: ${dateStr}`);
      return dateStr;
    }
  };

  // Get badge color based on entity type
  const getBadgeColor = (type: EntityType) => {
    switch (type) {
      case 'person': return 'blue';
      case 'organization': return 'orange';
      case 'event': return 'purple';
      case 'location': return 'green';
      default: return 'gray';
    }
  };

  // Get locations from metadata
  const getLocations = () => {
    // Check if entity and metadata and locations exist and is an array
    if (entity && entity.metadata && Array.isArray(entity.metadata.locations)) {
      // Directly return the array of unique locations
      return [...new Set(entity.metadata.locations as string[])];
    }
    // Handle case where it might be a string (legacy or incorrect data)
    if (entity && entity.metadata && typeof entity.metadata.locations === 'string') {
        console.warn("Locations metadata is a string, expected string[]. Attempting to parse.");
        const locationsStr = entity.metadata.locations as string;
        return [...new Set(locationsStr.split(',').map(loc => loc.trim()).filter(Boolean))];
    }
    return []; // Return empty array if no valid locations data found
  };

  const locations = getLocations();
  // Compute metadata entries excluding 'locations' safely
  const otherMetadataEntries = Object.entries(entity.metadata || {}).filter(([key]) => key !== 'locations');

  return (
    <Box 
      p={4} 
      bg={colorMode === 'dark' ? 'gray.800' : 'white'} 
      borderRadius="md" 
      boxShadow="sm"
      height="100%"
      overflowY="auto"
    >
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="md">{entity.name}</Heading>
        <IconButton
          aria-label="Close details"
          icon={<X size={16} />}
          size="sm"
          variant="ghost"
          onClick={onClose}
        />
      </Flex>
      
      <Flex align="center" mb={4}>
        <Badge 
          colorScheme={getBadgeColor(entity.type)} 
          textTransform="capitalize"
          px={2}
          py={1}
          borderRadius="full"
        >
          {entity.type}
        </Badge>
        
        {entity.startDate && (
          <Flex align="center" ml={2}>
            <Calendar size={14} className="mr-1" />
            <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
              {formatDate(entity.startDate)}
              {entity.endDate && entity.endDate !== entity.startDate && ` - ${formatDate(entity.endDate)}`}
            </Text>
          </Flex>
        )}
      </Flex>
      
      {entity.description && (
        <Box mb={4}>
          <Text fontSize="sm">{entity.description}</Text>
        </Box>
      )}
      
      {locations.length > 0 && (
        <Box mb={4}>
          <Heading size="sm" mb={2}>Associated Locations</Heading>
          <List spacing={1}>
            {locations.map((location, index) => (
              <ListItem key={index}>
                <Flex align="center">
                  <MapPin size={14} className="mr-2 text-green-500" />
                  <Text fontSize="sm">{location}</Text>
                </Flex>
              </ListItem>
            ))}
          </List>
        </Box>
      )}
      
      {otherMetadataEntries.length > 0 && (
        <Box mb={4}>
          <Heading size="sm" mb={2}>Additional Information</Heading>
          <List spacing={1}>
            {otherMetadataEntries.map(([key, value]) => (
              <ListItem key={key}>
                <Flex>
                  <Text fontSize="sm" fontWeight="semibold" width="120px" textTransform="capitalize">
                    {key}:
                  </Text>
                  <Text fontSize="sm">{value.toString()}</Text>
                </Flex>
              </ListItem>
            ))}
          </List>
        </Box>
      )}
      
      <Divider my={4} />
      
      <Box mb={4}>
        <Flex justify="space-between" align="center" mb={2}>
          <Heading size="sm">Connections ({relationships.length})</Heading>
          <Tooltip label="Expand neighborhood">
            <IconButton
              aria-label="Expand neighborhood"
              icon={<ExternalLink size={16} />}
              size="xs"
              variant="ghost"
              onClick={() => onExpandNeighborhood(entity.id)}
            />
          </Tooltip>
        </Flex>
        
        {relationships.length > 0 ? (
          <List spacing={2}>
            {relationships.map(({ entity: relatedEntity, relationship }) => (
              <ListItem 
                key={relationship.id}
                p={2}
                borderRadius="md"
                bg={colorMode === 'dark' ? 'gray.700' : 'gray.50'}
                _hover={{ bg: colorMode === 'dark' ? 'gray.600' : 'gray.100' }}
                cursor="pointer"
                onClick={() => onSelectEntity(relatedEntity.id)}
              >
                <Flex direction="column" gap={1}>
                  <Flex justify="space-between" align="center">
                    <Text fontWeight="medium">{relatedEntity.name}</Text>
                    <Badge 
                      colorScheme={getBadgeColor(relatedEntity.type)} 
                      textTransform="capitalize"
                      size="sm"
                    >
                      {relatedEntity.type}
                    </Badge>
                  </Flex>
                  
                  <Flex align="center">
                    <Box 
                      w="8" 
                      h="2" 
                      bg={(theme.colors.relationshipColors as Record<string, string>)[relationship.type]} 
                      mr={2} 
                      borderRadius="sm"
                    />
                    <Text fontSize="xs" textTransform="capitalize">{relationship.type}</Text>
                  </Flex>
                  
                  {relationship.description && (
                    <Text fontSize="xs" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
                      {relationship.description}
                    </Text>
                  )}
                  
                  {relationship.startDate && (
                    <Flex align="center" fontSize="xs" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
                      <Calendar size={12} className="mr-1" />
                      {formatDate(relationship.startDate)}
                      {relationship.endDate && relationship.endDate !== relationship.startDate && 
                        ` - ${formatDate(relationship.endDate)}`}
                    </Flex>
                  )}
                  
                  {relationship.metadata?.bibliography && (
                    <Flex align="center" fontSize="xs" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
                      <Book size={12} className="mr-1" />
                      <Text as="i">{relationship.metadata.bibliography.toString()}</Text>
                    </Flex>
                  )}
                </Flex>
              </ListItem>
            ))}
          </List>
        ) : (
          <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
            No connected entities found.
          </Text>
        )}
      </Box>
      
      <Button 
        size="sm" 
        width="full" 
        colorScheme={colorMode === 'dark' ? 'blue' : 'brand'}
        onClick={() => onExpandNeighborhood(entity.id)}
      >
        Expand Neighborhood
      </Button>
    </Box>
  );
};

export default EntityDetailsPanel;
