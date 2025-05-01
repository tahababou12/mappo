import React, { useState } from 'react';
import {
  Box,
  Flex,
  useColorMode,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  IconButton,
  useDisclosure,
  Tooltip,
  Kbd,
} from '@chakra-ui/react';
import { MessageSquareText } from 'lucide-react';
import QueryInput from './QueryInput';
import QueryResults from './QueryResults';
import { QueryResult, Entity } from '../../types';

interface QueryInterfaceProps {
  entities: Entity[];
  onSelectEntity: (entityId: string) => void;
}

const QueryInterface: React.FC<QueryInterfaceProps> = ({ entities, onSelectEntity }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { colorMode } = useColorMode();
  const [isLoading, setIsLoading] = useState(false);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);

  // Create a map of entity IDs to entity info for quick lookup
  const entityMap = entities.reduce((acc, entity) => {
    acc[entity.id] = { name: entity.name, type: entity.type };
    return acc;
  }, {} as Record<string, { name: string; type: string }>);

  const handleSubmitQuery = async (query: string) => {
    setIsLoading(true);
    
    // Simulate API call with a timeout
    setTimeout(() => {
      // Mock result - in a real app, this would come from the RAG system
      const mockResult: QueryResult = {
        text: `Analysis of "${query}": This query relates to historical connections in the network. Based on the data, there are several key entities involved including Abraham Lincoln, the Civil War, and related events.`,
        entities: entities.slice(0, 5).map(e => e.id), // Just use the first 5 entities as an example
        relationships: ['Led Union during war', 'Issued proclamation', 'Military opponents'],
      };
      
      setQueryResult(mockResult);
      setIsLoading(false);
    }, 1500);
  };

  // Handle keyboard shortcut for opening query interface
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'q' && !e.ctrlKey && !e.metaKey) {
        onOpen();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpen]);

  return (
    <>
      {/* Drawer toggle button */}
      <Tooltip label="Open query interface (Q)" placement="left">
        <IconButton
          aria-label="Open query interface"
          icon={<MessageSquareText size={20} />}
          position="fixed"
          bottom="4"
          right="4"
          colorScheme={colorMode === 'dark' ? 'blue' : 'brand'}
          borderRadius="full"
          boxShadow="lg"
          onClick={onOpen}
          zIndex="docked"
          size="lg"
        />
      </Tooltip>
      
      {/* Query drawer */}
      <Drawer
        isOpen={isOpen}
        placement="bottom"
        onClose={onClose}
        size="md"
      >
        <DrawerOverlay />
        <DrawerContent 
          bg={colorMode === 'dark' ? 'gray.800' : 'white'}
          borderTopRadius="lg"
          maxH="50vh"
        >
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">
            Query Interface <Kbd ml={2} fontSize="xs">Q</Kbd>
          </DrawerHeader>
          
          <DrawerBody p={4}>
            <Flex direction={{ base: 'column', md: 'row' }} gap={4} height="100%">
              <Box flex="1">
                <QueryInput 
                  onSubmitQuery={handleSubmitQuery} 
                  isLoading={isLoading} 
                />
              </Box>
              
              <Box flex="1">
                <QueryResults 
                  result={queryResult} 
                  onSelectEntity={onSelectEntity}
                  entities={entityMap}
                />
              </Box>
            </Flex>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default QueryInterface;
