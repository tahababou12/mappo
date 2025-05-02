import React, { useState, useEffect } from 'react';
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
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  RangeSlider,
  RangeSliderTrack,
  RangeSliderFilledTrack,
  RangeSliderThumb,
} from '@chakra-ui/react';
import { X, ExternalLink, MapPin, Book, Calendar, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
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
  onTimeRangeChange?: (range: [number, number]) => void;
}

const EntityDetailsPanel: React.FC<EntityDetailsPanelProps> = ({
  entity,
  relationships,
  onClose,
  onSelectEntity,
  onExpandNeighborhood,
  onTimeRangeChange,
}) => {
  const { colorMode } = useColorMode();
  // Initialize timeRange for filtering connections by year
  const [timeRange, setTimeRange] = useState<[number, number]>([1800, 1900]);
  
  // Calculate min/max years from the entity and its relationships
  const allYears = React.useMemo(() => {
    if (!entity) return [];
    
    const years: number[] = [];
    
    // Add entity years if available
    if (entity.startDate) {
      years.push(parseInt(entity.startDate.split('-')[0]));
    }
    if (entity.endDate) {
      years.push(parseInt(entity.endDate.split('-')[0]));
    }
    
    // Add relationship years
    relationships.forEach(({ relationship }) => {
      if (relationship.startDate) {
        years.push(parseInt(relationship.startDate.split('-')[0]));
      }
      if (relationship.endDate) {
        years.push(parseInt(relationship.endDate.split('-')[0]));
      }
    });
    
    return years.filter(year => !isNaN(year));
  }, [entity, relationships]);
  
  const minYear = React.useMemo(() => 
    allYears.length > 0 ? Math.max(1700, Math.min(...allYears)) : 1800, 
    [allYears]
  );
  
  const maxYear = React.useMemo(() => 
    allYears.length > 0 ? Math.min(2000, Math.max(...allYears)) : 1900, 
    [allYears]
  );
  
  // Set initial time range when entity or relationships change
  useEffect(() => {
    if (allYears.length > 0) {
      setTimeRange([minYear, maxYear]);
    }
  }, [entity?.id, minYear, maxYear, allYears.length]);
  
  // Propagate time range changes to parent component
  useEffect(() => {
    if (onTimeRangeChange) {
      onTimeRangeChange(timeRange);
    }
  }, [timeRange, onTimeRangeChange]);
  
  // Filter relationships by time range
  const filteredRelationships = React.useMemo(() => {
    return relationships.filter(({ relationship }) => {
      // If no dates, include by default
      if (!relationship.startDate && !relationship.endDate) return true;
      
      // Check relationship years
      const startYear = relationship.startDate 
        ? parseInt(relationship.startDate.split('-')[0]) 
        : null;
      const endYear = relationship.endDate 
        ? parseInt(relationship.endDate.split('-')[0]) 
        : null;
        
      // If only start date, check if it's in range
      if (startYear && !endYear) {
        return startYear >= timeRange[0] && startYear <= timeRange[1];
      }
      
      // If only end date, check if it's in range
      if (!startYear && endYear) {
        return endYear >= timeRange[0] && endYear <= timeRange[1];
      }
      
      // If both dates, check if ranges overlap
      if (startYear && endYear) {
        return !(endYear < timeRange[0] || startYear > timeRange[1]);
      }
      
      return true;
    });
  }, [relationships, timeRange]);
  
  // Calculate unique inbound and outbound connections
  const connectionStats = React.useMemo(() => {
    if (!entity) return { inbound: 0, outbound: 0, total: 0 };
    
    // Get unique entity IDs for inbound connections
    const uniqueInboundEntities = new Set(
      filteredRelationships
        .filter(({ relationship }) => {
          const target = typeof relationship.target === 'object' 
            ? relationship.target.id 
            : relationship.target;
          return target === entity.id;
        })
        .map(({ entity: relatedEntity }) => relatedEntity.id)
    );
    
    // Get unique entity IDs for outbound connections
    const uniqueOutboundEntities = new Set(
      filteredRelationships
        .filter(({ relationship }) => {
          const source = typeof relationship.source === 'object' 
            ? relationship.source.id 
            : relationship.source;
          return source === entity.id;
        })
        .map(({ entity: relatedEntity }) => relatedEntity.id)
    );
    
    // Get all unique connected entities
    const uniqueConnectedEntities = new Set(
      filteredRelationships.map(({ entity: relatedEntity }) => relatedEntity.id)
    );
    
    return {
      inbound: uniqueInboundEntities.size,
      outbound: uniqueOutboundEntities.size,
      total: uniqueConnectedEntities.size
    };
  }, [entity, filteredRelationships]);

  // Group relationships by entity to avoid duplicates in the UI
  const groupedRelationships = React.useMemo(() => {
    if (!filteredRelationships.length) return [];
    
    // Group by entity ID
    const groupedByEntity = filteredRelationships.reduce((groups, item) => {
      const entityId = item.entity.id;
      if (!groups[entityId]) {
        groups[entityId] = {
          entity: item.entity,
          relationships: []
        };
      }
      groups[entityId].relationships.push(item.relationship);
      return groups;
    }, {} as Record<string, { entity: Entity, relationships: Relationship[] }>);
    
    // Convert to array and sort by entity name
    return Object.values(groupedByEntity).sort((a, b) => 
      a.entity.name.localeCompare(b.entity.name)
    );
  }, [filteredRelationships]);

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

  // Handle time range change
  const handleTimeRangeChange = (values: number[]) => {
    const newRange: [number, number] = [values[0], values[1]];
    setTimeRange(newRange);
    
    // Propagate to parent if callback is provided
    if (onTimeRangeChange) {
      onTimeRangeChange(newRange);
    }
  };

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
      
      {/* Connection Statistics */}
      <Box mb={4}>
        <Heading size="sm" mb={3}>Connection Statistics</Heading>
        <StatGroup>
          <Stat>
            <StatLabel>Total</StatLabel>
            <StatNumber>{connectionStats.total}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>
              <Flex align="center">
                <ArrowDownLeft size={14} className="mr-1" /> Inbound
              </Flex>
            </StatLabel>
            <StatNumber>{connectionStats.inbound}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>
              <Flex align="center">
                <ArrowUpRight size={14} className="mr-1" /> Outbound
              </Flex>
            </StatLabel>
            <StatNumber>{connectionStats.outbound}</StatNumber>
          </Stat>
        </StatGroup>
      </Box>
      
      {/* Time Range Slider for Connection Filtering */}
      <Box mb={4}>
        <Heading size="sm" mb={3}>Filter Connections by Year</Heading>
        <Box px={2}>
          <RangeSlider
            aria-label={['min', 'max']}
            value={timeRange}
            min={minYear}
            max={maxYear}
            step={1}
            onChange={handleTimeRangeChange}
            colorScheme={colorMode === 'dark' ? 'blue' : 'brand'}
          >
            <RangeSliderTrack>
              <RangeSliderFilledTrack />
            </RangeSliderTrack>
            <RangeSliderThumb index={0} boxSize={6}>
              <Box color={colorMode === 'dark' ? 'white' : 'black'} fontSize="xs">{timeRange[0]}</Box>
            </RangeSliderThumb>
            <RangeSliderThumb index={1} boxSize={6}>
              <Box color={colorMode === 'dark' ? 'white' : 'black'} fontSize="xs">{timeRange[1]}</Box>
            </RangeSliderThumb>
          </RangeSlider>
          <Flex justify="space-between" mt={1}>
            <Text fontSize="sm">{minYear}</Text>
            <Text fontSize="sm">{maxYear}</Text>
          </Flex>
        </Box>
      </Box>
      
      <Box mb={4}>
        <Flex justify="space-between" align="center" mb={2}>
          <Heading size="sm">Connections ({connectionStats.total})</Heading>
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
        
        {groupedRelationships.length > 0 ? (
          <List spacing={2}>
            {groupedRelationships.map(({ entity: relatedEntity, relationships: entityRelationships }) => (
              <ListItem 
                key={relatedEntity.id}
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
                  
                  {/* Show the primary relationship type and direction */}
                  <Flex align="center">
                    {/* Direction indicator based on first relationship */}
                    {entityRelationships[0].source === entity.id ? (
                      <Tooltip label="Outbound connection">
                        <Box as={ArrowUpRight} size={14} mr={1} color="green.400" />
                      </Tooltip>
                    ) : (
                      <Tooltip label="Inbound connection">
                        <Box as={ArrowDownLeft} size={14} mr={1} color="blue.400" />
                      </Tooltip>
                    )}
                    
                    <Box 
                      w="8" 
                      h="2" 
                      bg={(theme.colors.relationshipColors as Record<string, string>)[entityRelationships[0].type]} 
                      mr={2} 
                      borderRadius="sm"
                    />
                    <Text fontSize="xs" textTransform="capitalize">{entityRelationships[0].type}</Text>
                    
                    {/* Show count of interactions if more than one */}
                    {entityRelationships.length > 1 && (
                      <Badge ml={2} colorScheme="gray" variant="outline" fontSize="2xs">
                        {entityRelationships.length} interactions
                      </Badge>
                    )}
                  </Flex>
                  
                  {/* Show the description of the first relationship */}
                  {entityRelationships[0].description && (
                    <Text fontSize="xs" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
                      {entityRelationships[0].description}
                    </Text>
                  )}
                  
                  {/* Show date range if available */}
                  {entityRelationships.some(r => r.startDate) && (
                    <Flex align="center" fontSize="xs" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
                      <Calendar size={12} className="mr-1" />
                      {(() => {
                        // Get all years for display
                        const years = entityRelationships
                          .filter(r => r.startDate)
                          .map(r => parseInt(r.startDate!.split('-')[0]))
                          .sort((a, b) => a - b);
                        
                        const earliestYear = Math.min(...years);
                        const latestYear = Math.max(...years);
                        
                        return earliestYear === latestYear 
                          ? earliestYear.toString()
                          : `${earliestYear} - ${latestYear}`;
                      })()}
                    </Flex>
                  )}
                  
                  {/* Show bibliography if available */}
                  {entityRelationships[0].metadata?.bibliography && (
                    <Flex align="center" fontSize="xs" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
                      <Book size={12} className="mr-1" />
                      <Text as="i">{entityRelationships[0].metadata.bibliography.toString()}</Text>
                    </Flex>
                  )}
                </Flex>
              </ListItem>
            ))}
          </List>
        ) : (
          <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
            No connected entities found in the selected time range.
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
