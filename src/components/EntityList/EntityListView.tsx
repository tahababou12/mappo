import React, { useState, useMemo } from 'react';
import {
  Box,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Flex,
  Text,
  Select,
  HStack,
  useColorMode,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  IconButton,
  useDisclosure,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
} from '@chakra-ui/react';
import { Users, Search, Filter, ChevronDown, ArrowUpDown, Info, Network } from 'lucide-react';
import { GraphData, Entity } from '../../types';

// Add the connections property to the extended Entity type
interface EntityWithConnections extends Entity {
  connections: number;
}

interface EntityListViewProps {
  data: GraphData;
  onNodeSelect: (nodeId: string) => void;
}

const EntityListView: React.FC<EntityListViewProps> = ({ data, onNodeSelect }) => {
  const { colorMode } = useColorMode();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedEntity, setSelectedEntity] = useState<EntityWithConnections | null>(null);
  const [sortField, setSortField] = useState<'name' | 'type' | 'connections'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Calculate connections for each entity
  const entitiesWithConnections = useMemo(() => {
    return data.nodes.map(node => {
      const connections = data.links.filter(link => {
        // @ts-expect-error - Ignoring type checking for source and target properties
        const source = typeof link.source === 'object' ? link.source.id : link.source;
        // @ts-expect-error - Ignoring type checking for source and target properties
        const target = typeof link.target === 'object' ? link.target.id : link.target;
        return source === node.id || target === node.id;
      }).length;
      
      return {
        ...node,
        connections
      } as EntityWithConnections;
    });
  }, [data]);

  // Filter entities based on search and type filter
  const filteredEntities = useMemo(() => {
    return entitiesWithConnections.filter(entity => {
      // Filter by search query
      const matchesSearch = entity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (entity.description && entity.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Filter by entity type
      const matchesType = typeFilter === 'all' || entity.type === typeFilter;
      
      return matchesSearch && matchesType;
    });
  }, [entitiesWithConnections, searchQuery, typeFilter]);

  // Sort entities
  const sortedEntities = useMemo(() => {
    return [...filteredEntities].sort((a, b) => {
      let comparison = 0;
      
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === 'type') {
        comparison = a.type.localeCompare(b.type);
      } else if (sortField === 'connections') {
        comparison = a.connections - b.connections;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredEntities, sortField, sortDirection]);

  // Toggle sort order
  const toggleSort = (field: 'name' | 'type' | 'connections') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handle row click
  const handleRowClick = (entity: EntityWithConnections) => {
    setSelectedEntity(entity);
    onOpen();
  };

  // Handle view in graph button
  const handleViewInGraph = (entity: EntityWithConnections) => {
    onNodeSelect(entity.id);
    onClose();
  };

  return (
    <Box 
      width="100%" 
      height="100%"
      p={4}
      bg={colorMode === 'dark' ? 'gray.900' : 'gray.50'}
      overflowY="auto"
    >
      <Flex align="center" mb={6}>
        <Users size={24} className="mr-2" />
        <Heading size="lg">Entity List</Heading>
      </Flex>

      {/* Search and filter controls */}
      <Flex 
        direction={{ base: 'column', md: 'row' }} 
        justify="space-between" 
        align={{ base: 'stretch', md: 'center' }}
        mb={4}
        gap={4}
      >
        <InputGroup maxW={{ md: '400px' }}>
          <InputLeftElement pointerEvents="none">
            <Search size={18} color={colorMode === 'dark' ? 'gray.300' : 'gray.400'} />
          </InputLeftElement>
          <Input 
            placeholder="Search entities..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </InputGroup>

        <HStack spacing={2}>
          <Select 
            value={typeFilter} 
            onChange={(e) => setTypeFilter(e.target.value)}
            size="md"
            maxW="180px"
          >
            <option value="all">All Types</option>
            <option value="person">People</option>
            <option value="organization">Organizations</option>
            <option value="event">Events</option>
            <option value="location">Locations</option>
          </Select>

          <Menu>
            <MenuButton as={Button} rightIcon={<ChevronDown />} leftIcon={<Filter size={16} />} size="md">
              Sort
            </MenuButton>
            <MenuList>
              <MenuItem onClick={() => toggleSort('name')}>
                Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
              </MenuItem>
              <MenuItem onClick={() => toggleSort('type')}>
                Type {sortField === 'type' && (sortDirection === 'asc' ? '↑' : '↓')}
              </MenuItem>
              <MenuItem onClick={() => toggleSort('connections')}>
                Connections {sortField === 'connections' && (sortDirection === 'asc' ? '↑' : '↓')}
              </MenuItem>
              <MenuDivider />
              <MenuItem onClick={() => setSortDirection('asc')}>Ascending</MenuItem>
              <MenuItem onClick={() => setSortDirection('desc')}>Descending</MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>

      {/* Results count */}
      <Text mb={4} fontSize="sm" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
        Showing {sortedEntities.length} {sortedEntities.length === 1 ? 'entity' : 'entities'} 
        {typeFilter !== 'all' && ` of type "${typeFilter}"`}
        {searchQuery && ` matching "${searchQuery}"`}
      </Text>

      {/* Entities table */}
      <Box 
        borderWidth="1px" 
        borderRadius="lg" 
        overflow="hidden"
        bg={colorMode === 'dark' ? 'gray.800' : 'white'}
      >
        <Table variant="simple" size="md">
          <Thead>
            <Tr>
              <Th onClick={() => toggleSort('name')} cursor="pointer">
                <Flex align="center">
                  Name
                  {sortField === 'name' && (
                    <ArrowUpDown size={14} className="ml-1" />
                  )}
                </Flex>
              </Th>
              <Th onClick={() => toggleSort('type')} cursor="pointer">
                <Flex align="center">
                  Type
                  {sortField === 'type' && (
                    <ArrowUpDown size={14} className="ml-1" />
                  )}
                </Flex>
              </Th>
              <Th onClick={() => toggleSort('connections')} cursor="pointer" isNumeric>
                <Flex align="center" justify="flex-end">
                  Connections
                  {sortField === 'connections' && (
                    <ArrowUpDown size={14} className="ml-1" />
                  )}
                </Flex>
              </Th>
              <Th width="50px"></Th>
            </Tr>
          </Thead>
          <Tbody>
            {sortedEntities.map((entity) => (
              <Tr 
                key={entity.id}
                _hover={{ bg: colorMode === 'dark' ? 'gray.700' : 'gray.50' }}
                cursor="pointer"
                onClick={() => handleRowClick(entity)}
              >
                <Td>{entity.name}</Td>
                <Td>
                  <Badge colorScheme={
                    entity.type === 'person' ? 'blue' :
                    entity.type === 'organization' ? 'orange' :
                    entity.type === 'event' ? 'purple' : 'green'
                  }>
                    {entity.type}
                  </Badge>
                </Td>
                <Td isNumeric>{entity.connections}</Td>
                <Td>
                  <IconButton
                    aria-label="View details"
                    icon={<Info size={16} />}
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRowClick(entity);
                    }}
                  />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      {/* Entity Details Drawer */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">
            {selectedEntity?.name}
          </DrawerHeader>

          <DrawerBody>
            {selectedEntity && (
              <Box>
                <Flex mb={4}>
                  <Badge colorScheme={
                    selectedEntity.type === 'person' ? 'blue' :
                    selectedEntity.type === 'organization' ? 'orange' :
                    selectedEntity.type === 'event' ? 'purple' : 'green'
                  } fontSize="md" p={1}>
                    {selectedEntity.type}
                  </Badge>
                </Flex>

                {selectedEntity.description && (
                  <Box mb={4}>
                    <Heading size="sm" mb={2}>Description</Heading>
                    <Text>{selectedEntity.description}</Text>
                  </Box>
                )}

                {selectedEntity.startDate && (
                  <Box mb={4}>
                    <Heading size="sm" mb={2}>Date</Heading>
                    <Text>
                      {selectedEntity.startDate} 
                      {selectedEntity.endDate && ` - ${selectedEntity.endDate}`}
                    </Text>
                  </Box>
                )}

                {selectedEntity.location && (
                  <Box mb={4}>
                    <Heading size="sm" mb={2}>Location</Heading>
                    <Text>{selectedEntity.location}</Text>
                  </Box>
                )}

                <Box mb={4}>
                  <Heading size="sm" mb={2}>Network Connections</Heading>
                  <Text>{selectedEntity.connections} connections</Text>
                </Box>

                <Button 
                  leftIcon={<Network size={16} />} 
                  colorScheme="blue" 
                  onClick={() => handleViewInGraph(selectedEntity)}
                  mt={4}
                >
                  View in Network Graph
                </Button>
              </Box>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default EntityListView; 