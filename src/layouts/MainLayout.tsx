import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Grid,
  GridItem,
  useColorMode,
  IconButton,
  Heading,
  Tooltip,
  useDisclosure,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Badge,
  Text,
  HStack,
  VStack,
  Image,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Divider,
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { 
  Database, 
  Network, 
  History, 
  Filter, 
  Info, 
  Maximize2, 
  Minimize2, 
  Settings, 
  Download, 
  Share2, 
  HelpCircle, 
  ChevronDown,
  BookOpen,
  BarChart3,
  Users,
  Map,
} from 'lucide-react';
import SearchBar from '../components/Search/SearchBar';
import ControlPanel from '../components/ControlPanel/ControlPanel';
import GraphContainer from '../components/GraphVisualization/GraphContainer';
import EntityDetailsPanel from '../components/EntityDetails/EntityDetailsPanel';
import QueryInterface from '../components/QueryInterface/QueryInterface';
import ChatbotInterface from '../components/Chatbot/ChatbotInterface';
import { Entity, Relationship, FilterState, GraphData } from '../types';

interface MainLayoutProps {
  data: GraphData;
}

const MainLayout: React.FC<MainLayoutProps> = ({ data }) => {
  const { colorMode } = useColorMode();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { isOpen: isInfoOpen, onOpen: onInfoOpen, onClose: onInfoClose } = useDisclosure();
  
  // Initialize filters
  const [filters, setFilters] = useState<FilterState>({
    entityTypes: {
      person: true,
      organization: true,
      event: true,
      location: true
    },
    relationshipTypes: {
      family: true,
      professional: true,
      social: true,
      political: true,
      conflict: true
    },
    timeRange: [1800, 1900],
    showCommunities: false,
    layout: 'force',
    nodeSizeAttribute: 'degree'
  });

  // Get selected entity and its relationships
  const selectedEntity = selectedNodeId 
    ? data.nodes.find(node => node.id === selectedNodeId) || null 
    : null;
  
  const entityRelationships = selectedNodeId 
    ? data.links
        .filter(link => link.source === selectedNodeId || link.target === selectedNodeId)
        .map(link => {
          const otherEntityId = link.source === selectedNodeId ? link.target : link.source;
          const otherEntity = data.nodes.find(node => node.id === otherEntityId);
          
          return {
            entity: otherEntity as Entity,
            relationship: link
          };
        })
    : [];

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleNodeSelect = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    setIsLeftPanelCollapsed(false); // Expand panel when a node is selected
  };

  const handleSearch = (results: string[]) => {
    setSearchResults(results);
  };

  const handleExpandNeighborhood = (entityId: string) => {
    // In a real app, this would focus the graph on the neighborhood of this entity
    console.log(`Expanding neighborhood for entity ${entityId}`);
    
    // For demo purposes, just highlight the entity and its direct connections
    const directConnections = data.links
      .filter(link => link.source === entityId || link.target === entityId)
      .map(link => link.source === entityId ? link.target : link.source) as string[];
    
    setSearchResults([entityId, ...directConnections]);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    setIsLeftPanelCollapsed(true);
  };

  // Network statistics for info panel
  const networkStats = {
    nodes: data.nodes.length,
    links: data.links.length,
    personCount: data.nodes.filter(n => n.type === 'person').length,
    organizationCount: data.nodes.filter(n => n.type === 'organization').length,
    eventCount: data.nodes.filter(n => n.type === 'event').length,
    locationCount: data.nodes.filter(n => n.type === 'location').length,
    timeRange: `${Math.min(...data.nodes.filter(n => n.startDate).map(n => parseInt(n.startDate!.split('-')[0])))} - ${Math.max(...data.nodes.filter(n => n.endDate).map(n => parseInt(n.endDate!.split('-')[0])))}`
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key to deselect node
      if (e.key === 'Escape' && selectedNodeId) {
        setSelectedNodeId(null);
      }
      
      // F key to toggle fullscreen
      if (e.key === 'f' && !e.ctrlKey && !e.metaKey) {
        toggleFullscreen();
      }
      
      // / key to focus search
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        document.querySelector('input[placeholder="Search entities..."]')?.focus();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId]);

  return (
    <Box 
      minH="100vh" 
      bg={colorMode === 'dark' ? 'gray.900' : 'gray.50'}
      color={colorMode === 'dark' ? 'white' : 'gray.800'}
    >
      {/* Header */}
      {!isFullscreen && (
        <Flex 
          as="header" 
          align="center" 
          justify="space-between" 
          p={3} 
          bg={colorMode === 'dark' ? 'gray.800' : 'white'} 
          boxShadow="md"
          borderBottomWidth="1px"
          borderColor={colorMode === 'dark' ? 'gray.700' : 'gray.200'}
        >
          <Flex align="center" gap={2}>
            <Network size={28} className="text-blue-500" />
            <VStack spacing={0} align="start">
              <Heading size="md">Historical Network Analysis</Heading>
              <Text fontSize="xs" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
                American Civil War Era
              </Text>
            </VStack>
          </Flex>
          
          <Flex align="center" gap={3}>
            <Box width="300px">
              <SearchBar 
                entities={data.nodes} 
                onSearch={handleSearch}
                onSelectEntity={handleNodeSelect}
              />
            </Box>
            
            <HStack spacing={1}>
              <Menu>
                <MenuButton
                  as={Button}
                  variant="ghost"
                  size="sm"
                  rightIcon={<ChevronDown size={16} />}
                >
                  Views
                </MenuButton>
                <MenuList>
                  <MenuItem icon={<Network size={16} />}>Network Graph</MenuItem>
                  <MenuItem icon={<BarChart3 size={16} />}>Statistics</MenuItem>
                  <MenuItem icon={<Users size={16} />}>Entity List</MenuItem>
                  <MenuItem icon={<Map size={16} />}>Geographic Map</MenuItem>
                </MenuList>
              </Menu>
              
              <Tooltip label="Network Information">
                <IconButton
                  aria-label="Network Information"
                  icon={<Info size={18} />}
                  variant="ghost"
                  onClick={onInfoOpen}
                  size="sm"
                />
              </Tooltip>
              
              <Tooltip label="Export Data">
                <IconButton
                  aria-label="Export Data"
                  icon={<Download size={18} />}
                  variant="ghost"
                  size="sm"
                />
              </Tooltip>
              
              <Tooltip label="Share">
                <IconButton
                  aria-label="Share"
                  icon={<Share2 size={18} />}
                  variant="ghost"
                  size="sm"
                />
              </Tooltip>
              
              <Tooltip label="Settings">
                <IconButton
                  aria-label="Settings"
                  icon={<Settings size={18} />}
                  variant="ghost"
                  size="sm"
                />
              </Tooltip>
              
              <Tooltip label="Toggle Fullscreen (F)">
                <IconButton
                  aria-label="Toggle Fullscreen"
                  icon={<Maximize2 size={18} />}
                  variant="ghost"
                  onClick={toggleFullscreen}
                  size="sm"
                />
              </Tooltip>
              
              <Tooltip label="Help">
                <IconButton
                  aria-label="Help"
                  icon={<HelpCircle size={18} />}
                  variant="ghost"
                  size="sm"
                />
              </Tooltip>
            </HStack>
          </Flex>
        </Flex>
      )}
      
      {/* Main Content */}
      <Grid
        templateColumns={isLeftPanelCollapsed ? "40px 1fr" : "300px 1fr"}
        gap={0}
        height={isFullscreen ? "100vh" : "calc(100vh - 72px)"}
        transition="grid-template-columns 0.3s ease"
      >
        {/* Left Panel (Controls + Entity Details) */}
        <GridItem 
          position="relative" 
          bg={colorMode === 'dark' ? 'gray.800' : 'white'} 
          borderRight="1px" 
          borderColor={colorMode === 'dark' ? 'gray.700' : 'gray.200'}
        >
          {/* Panel collapse toggle */}
          <IconButton
            aria-label={isLeftPanelCollapsed ? "Expand panel" : "Collapse panel"}
            icon={isLeftPanelCollapsed ? <ChevronRightIcon size={16} /> : <ChevronLeftIcon size={16} />}
            position="absolute"
            top="2"
            right="-12px"
            zIndex="2"
            size="sm"
            colorScheme={colorMode === 'dark' ? 'blue' : 'brand'}
            onClick={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
          />
          
          {isFullscreen && (
            <IconButton
              aria-label="Exit Fullscreen"
              icon={<Minimize2 size={16} />}
              position="absolute"
              top="2"
              left="2"
              zIndex="2"
              size="sm"
              colorScheme={colorMode === 'dark' ? 'blue' : 'brand'}
              onClick={toggleFullscreen}
            />
          )}
          
          {!isLeftPanelCollapsed && (
            <Flex direction="column" height="100%">
              {selectedEntity ? (
                <Box height="100%" p={2}>
                  <EntityDetailsPanel
                    entity={selectedEntity}
                    relationships={entityRelationships}
                    onClose={() => setSelectedNodeId(null)}
                    onSelectEntity={handleNodeSelect}
                    onExpandNeighborhood={handleExpandNeighborhood}
                  />
                </Box>
              ) : (
                <Box height="100%" p={2}>
                  <Tabs isFitted variant="enclosed" colorScheme={colorMode === 'dark' ? 'blue' : 'brand'}>
                    <TabList mb="1em">
                      <Tab><Filter size={14} className="mr-1" /> Filters</Tab>
                      <Tab><History size={14} className="mr-1" /> History</Tab>
                      <Tab><BookOpen size={14} className="mr-1" /> Notes</Tab>
                    </TabList>
                    <TabPanels>
                      <TabPanel p={0}>
                        <ControlPanel 
                          filters={filters} 
                          onFilterChange={handleFilterChange} 
                        />
                      </TabPanel>
                      <TabPanel>
                        <Box p={2}>
                          <Heading size="sm" mb={3}>Viewing History</Heading>
                          <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
                            Recently viewed entities will appear here.
                          </Text>
                        </Box>
                      </TabPanel>
                      <TabPanel>
                        <Box p={2}>
                          <Heading size="sm" mb={3}>Research Notes</Heading>
                          <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
                            Add notes about your research findings here.
                          </Text>
                        </Box>
                      </TabPanel>
                    </TabPanels>
                  </Tabs>
                </Box>
              )}
            </Flex>
          )}
        </GridItem>
        
        {/* Right Panel (Graph Visualization) */}
        <GridItem>
          <Box height="100%" p={2}>
            <GraphContainer
              data={data}
              filters={filters}
              onNodeSelect={handleNodeSelect}
              selectedNodeId={selectedNodeId}
              searchResults={searchResults}
            />
          </Box>
        </GridItem>
      </Grid>
      
      {/* Query Interface (Drawer) */}
      <QueryInterface 
        entities={data.nodes}
        onSelectEntity={handleNodeSelect}
      />
      
      {/* Chatbot Interface */}
      <ChatbotInterface
        entities={data.nodes}
        onSelectEntity={handleNodeSelect}
      />
      
      {/* Network Information Drawer */}
      <Drawer
        isOpen={isInfoOpen}
        placement="right"
        onClose={onInfoClose}
        size="md"
      >
        <DrawerOverlay />
        <DrawerContent bg={colorMode === 'dark' ? 'gray.800' : 'white'}>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">
            <Flex align="center">
              <Database size={20} className="mr-2" />
              Network Information
            </Flex>
          </DrawerHeader>
          
          <DrawerBody>
            <Box mb={6}>
              <Heading size="sm" mb={3}>Network Statistics</Heading>
              <Grid templateColumns="1fr 1fr" gap={4}>
                <Box p={3} borderRadius="md" bg={colorMode === 'dark' ? 'gray.700' : 'gray.50'}>
                  <Text fontSize="sm" fontWeight="bold">Total Entities</Text>
                  <Text fontSize="2xl">{networkStats.nodes}</Text>
                </Box>
                <Box p={3} borderRadius="md" bg={colorMode === 'dark' ? 'gray.700' : 'gray.50'}>
                  <Text fontSize="sm" fontWeight="bold">Total Relationships</Text>
                  <Text fontSize="2xl">{networkStats.links}</Text>
                </Box>
              </Grid>
            </Box>
            
            <Box mb={6}>
              <Heading size="sm" mb={3}>Entity Types</Heading>
              <Flex wrap="wrap" gap={3}>
                <Badge colorScheme="blue" p={2} borderRadius="md" fontSize="md">
                  <Flex direction="column" align="center">
                    <Text>{networkStats.personCount}</Text>
                    <Text fontSize="xs">People</Text>
                  </Flex>
                </Badge>
                <Badge colorScheme="orange" p={2} borderRadius="md" fontSize="md">
                  <Flex direction="column" align="center">
                    <Text>{networkStats.organizationCount}</Text>
                    <Text fontSize="xs">Organizations</Text>
                  </Flex>
                </Badge>
                <Badge colorScheme="purple" p={2} borderRadius="md" fontSize="md">
                  <Flex direction="column" align="center">
                    <Text>{networkStats.eventCount}</Text>
                    <Text fontSize="xs">Events</Text>
                  </Flex>
                </Badge>
                <Badge colorScheme="green" p={2} borderRadius="md" fontSize="md">
                  <Flex direction="column" align="center">
                    <Text>{networkStats.locationCount}</Text>
                    <Text fontSize="xs">Locations</Text>
                  </Flex>
                </Badge>
              </Flex>
            </Box>
            
            <Box mb={6}>
              <Heading size="sm" mb={3}>Time Period</Heading>
              <Text>{networkStats.timeRange}</Text>
            </Box>
            
            <Box mb={6}>
              <Heading size="sm" mb={3}>Network Metrics</Heading>
              <Grid templateColumns="1fr 1fr" gap={4}>
                <Box p={3} borderRadius="md" bg={colorMode === 'dark' ? 'gray.700' : 'gray.50'}>
                  <Text fontSize="sm" fontWeight="bold">Average Degree</Text>
                  <Text fontSize="lg">{(networkStats.links * 2 / networkStats.nodes).toFixed(2)}</Text>
                </Box>
                <Box p={3} borderRadius="md" bg={colorMode === 'dark' ? 'gray.700' : 'gray.50'}>
                  <Text fontSize="sm" fontWeight="bold">Network Density</Text>
                  <Text fontSize="lg">
                    {(networkStats.links / (networkStats.nodes * (networkStats.nodes - 1) / 2)).toFixed(3)}
                  </Text>
                </Box>
              </Grid>
            </Box>
            
            <Divider my={4} />
            
            <Box>
              <Heading size="sm" mb={3}>Data Source</Heading>
              <Text fontSize="sm">
                This historical network dataset contains information about key figures, organizations, events, and locations from the American Civil War era, including their relationships and connections.
              </Text>
              
              <Button 
                mt={4} 
                size="sm" 
                leftIcon={<Download size={14} />}
                colorScheme={colorMode === 'dark' ? 'blue' : 'brand'}
              >
                Download Dataset
              </Button>
            </Box>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default MainLayout;
