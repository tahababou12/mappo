import React from 'react';
import {
  Box,
  Text,
  Heading,
  List,
  ListItem,
  Badge,
  Flex,
  useColorMode,
  Divider,
} from '@chakra-ui/react';
import { QueryResult } from '../../types';

interface QueryResultsProps {
  result: QueryResult | null;
  onSelectEntity: (entityId: string) => void;
  entities: Record<string, { name: string; type: string }>;
}

const QueryResults: React.FC<QueryResultsProps> = ({ result, onSelectEntity, entities }) => {
  const { colorMode } = useColorMode();

  if (!result) {
    return (
      <Box 
        p={4} 
        bg={colorMode === 'dark' ? 'gray.700' : 'gray.50'} 
        borderRadius="md"
        height="100%"
      >
        <Text color={colorMode === 'dark' ? 'gray.400' : 'gray.500'} textAlign="center">
          Ask a question to see results here.
        </Text>
      </Box>
    );
  }

  // Get badge color based on entity type
  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'person': return 'blue';
      case 'organization': return 'orange';
      case 'event': return 'purple';
      case 'location': return 'green';
      default: return 'gray';
    }
  };

  return (
    <Box 
      p={4} 
      bg={colorMode === 'dark' ? 'gray.700' : 'gray.50'} 
      borderRadius="md"
      height="100%"
      overflowY="auto"
    >
      <Heading size="sm" mb={3}>Query Results</Heading>
      
      <Box mb={4}>
        <Text>{result.text}</Text>
      </Box>
      
      {(result.entities.length > 0 || result.relationships.length > 0) && (
        <>
          <Divider my={3} />
          
          {result.entities.length > 0 && (
            <Box mb={4}>
              <Heading size="xs" mb={2}>Referenced Entities</Heading>
              <List spacing={1}>
                {result.entities.map((entityId) => {
                  const entity = entities[entityId];
                  if (!entity) return null;
                  
                  return (
                    <ListItem key={entityId}>
                      <Flex 
                        align="center" 
                        p={1} 
                        borderRadius="md" 
                        _hover={{ bg: colorMode === 'dark' ? 'gray.600' : 'gray.100' }}
                        cursor="pointer"
                        onClick={() => onSelectEntity(entityId)}
                      >
                        <Text fontSize="sm">{entity.name}</Text>
                        <Badge 
                          ml={2} 
                          colorScheme={getBadgeColor(entity.type)} 
                          textTransform="capitalize"
                          size="sm"
                        >
                          {entity.type}
                        </Badge>
                      </Flex>
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          )}
          
          {result.relationships.length > 0 && (
            <Box>
              <Heading size="xs" mb={2}>Referenced Relationships</Heading>
              <List spacing={1}>
                {result.relationships.map((relationshipId, index) => (
                  <ListItem key={index}>
                    <Text fontSize="sm">{relationshipId}</Text>
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default QueryResults;
