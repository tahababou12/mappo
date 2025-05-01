import React, { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { Box, useColorMode, Button, ButtonGroup, Flex, Tooltip, Spinner, Text, useToast } from '@chakra-ui/react';
import ForceGraph from './ForceGraph';
import ForceGraph3D from './ForceGraph3D';
import GraphLegend from './GraphLegend';
import { GraphData, GraphNode, FilterState } from '../../types';
import { Boxes, Square } from 'lucide-react';

interface GraphContainerProps {
  data: GraphData;
  filters: FilterState;
  onNodeSelect: (nodeId: string) => void;
  selectedNodeId: string | null;
  searchResults: string[];
}

// Error boundary for handling 3D rendering errors
class GraphErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onError: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("Graph rendering error:", error);
    this.props.onError();
  }

  render() {
    if (this.state.hasError) {
      return null; // Return null to let the parent component handle the fallback UI
    }
    return this.props.children;
  }
}

const GraphContainer: React.FC<GraphContainerProps> = ({
  data,
  filters,
  onNodeSelect,
  selectedNodeId,
  searchResults,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [is3D, setIs3D] = useState(false);  // Start with 2D view for better compatibility
  const [isLoading, setIsLoading] = useState(false);
  const [has3DError, setHas3DError] = useState(false);
  const { colorMode } = useColorMode();
  const toast = useToast();

  // Add a reference to track filter change count for reliable remounting
  const filterChangeCountRef = useRef(0);

  // Add reference to track previous filters
  const prevFiltersRef = useRef<FilterState>(filters);

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  // Adapter function to handle node clicks (converts GraphNode to string ID)
  const handleNodeClick = useCallback((node: GraphNode) => {
    if (node && node.id) {
      console.log("GraphContainer: Node clicked:", node.id);
      onNodeSelect(node.id);
    }
  }, [onNodeSelect]);

  // Function to handle 3D view errors
  const handle3DError = useCallback(() => {
    console.error("Error in 3D view, switching to 2D view");
    setHas3DError(true);
    setIs3D(false);
  }, []);

  // Reset loading state after view mode changes
  useEffect(() => {
    // Clear loading state after a short delay
    const loadingTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(loadingTimeout);
  }, [is3D]);

  // Toggle between 2D and 3D views
  const toggleView = useCallback(() => {
    if (!is3D && has3DError) {
      toast({
        title: "3D View Unavailable",
        description: "There was an error loading the 3D view. Please try updating your browser or graphics drivers.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    setIsLoading(true);
    setIs3D(!is3D);
  }, [is3D, has3DError, toast]);

  // Reset 3D error state and force remount when filters change
  useEffect(() => {
    setHas3DError(false);
    
    // Increment the filter change counter - this will be used for remounting
    filterChangeCountRef.current += 1;
    
    // Check if the change is just a time range adjustment
    const isOnlyTimeRangeChange = () => {
      // Return true if only timeRange changed, false if any other filter changed
      return (
        JSON.stringify(prevFiltersRef.current.entityTypes) === JSON.stringify(filters.entityTypes) &&
        JSON.stringify(prevFiltersRef.current.relationshipTypes) === JSON.stringify(filters.relationshipTypes) &&
        prevFiltersRef.current.layout === filters.layout &&
        prevFiltersRef.current.nodeSizeAttribute === filters.nodeSizeAttribute &&
        prevFiltersRef.current.showCommunities === filters.showCommunities
      );
    };
    
    // If it's only a time range change, don't show loading
    if (isOnlyTimeRangeChange()) {
      console.log("GraphContainer: Time range change detected, updating without loading state");
    } else {
      // For other filter changes, briefly show loading state
      console.log("GraphContainer: Non-time filter change detected, forcing re-render");
      setIsLoading(true);
      
      // Use a very short timeout to trigger a complete re-render cycle
      const loadingTimeout = setTimeout(() => {
        setIsLoading(false);
        console.log("GraphContainer: Re-render complete");
      }, 50); // Very short timeout to minimize visible loading state
      
      return () => clearTimeout(loadingTimeout);
    }
    
    // Update the previous filters reference for next comparison
    prevFiltersRef.current = {...filters};
  }, [filters]);

  // Use custom cache-busting key to force complete remount of graph components when filters change
  const cacheKey = React.useMemo(() => {
    return `filter-change-${filterChangeCountRef.current}-${JSON.stringify({
      nodeTypes: filters.entityTypes,
      relationshipTypes: filters.relationshipTypes,
      timeRange: filters.timeRange
    })}`;
  }, [filters]);

  // Additional safety check: If the selected view is 2D, ensure ForceGraph is properly remounted when filters change
  const ForceGraphWithKey = React.useMemo(() => {
    return (props: Omit<React.ComponentProps<typeof ForceGraph>, 'key'>) => (
      <ForceGraph 
        key={cacheKey}
        {...props}
      />
    );
  }, [cacheKey]);

  // Use 2D view for initial render to avoid flickering
  useEffect(() => {
    // Start with 2D view to ensure fast initial load
    setIs3D(false);
    
    // Check if WebGL is available
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        console.warn('WebGL not supported - 3D view will be disabled');
        setHas3DError(true);
      }
    } catch (e) {
      console.error('Error checking WebGL support:', e);
      setHas3DError(true);
    }
  }, []);

  // Add check to restore edges if they disappear after filter changes
  const handleFilterStateRestoration = useCallback(() => {
    // Use a slight delay to ensure the DOM has updated
    setTimeout(() => {
      // Find all path elements (edges) in the graph
      const edgeElements = document.querySelectorAll('.link');
      console.log(`GraphContainer: Found ${edgeElements.length} edge elements in the DOM`);
      
      // If we can't find any edges but we know nodes exist, try to force a full reload
      if (edgeElements.length === 0 && data.nodes.length > 0) {
        console.warn("GraphContainer: No edge elements found! Forcing full reload");
        setIsLoading(true);
        
        // Force a complete component remount
        setTimeout(() => {
          filterChangeCountRef.current += 1;
          setIsLoading(false);
        }, 100);
      }
    }, 200);
  }, [data.nodes.length]);
  
  // Apply edge restoration check when filters change or graph is toggled
  useEffect(() => {
    handleFilterStateRestoration();
  }, [filters, is3D, handleFilterStateRestoration]);
  
  // Show all nodes and links button
  const handleShowAllClick = useCallback(() => {
    console.log("GraphContainer: Show All button clicked");
    onNodeSelect(''); // Deselect any selected node
    // Force rerender on next tick
    setTimeout(() => {
      filterChangeCountRef.current += 1;
      setIsLoading(true);
      setTimeout(() => setIsLoading(false), 50);
    }, 0);
  }, [onNodeSelect]);

  return (
    <Box 
      ref={containerRef} 
      width="100%" 
      height="100%" 
      bg={colorMode === 'dark' ? 'gray.900' : 'gray.50'}
      borderRadius="md"
      overflow="hidden"
      position="relative"
    >
      {/* Loading indicator */}
      {isLoading && (
        <Flex 
          position="absolute" 
          top="0" 
          left="0" 
          width="100%" 
          height="100%" 
          justify="center" 
          align="center" 
          zIndex="10"
          bg={colorMode === 'dark' ? 'blackAlpha.700' : 'whiteAlpha.700'}
        >
          <Spinner size="xl" />
        </Flex>
      )}
      
      {/* Render appropriate graph component */}
      {is3D ? (
        <GraphErrorBoundary onError={handle3DError}>
          <Suspense fallback={
            <Flex 
              width="100%" 
              height="100%" 
              justify="center" 
              align="center"
            >
              <Spinner size="xl" />
            </Flex>
          }>
            <ForceGraph3D 
              width={dimensions.width} 
              height={dimensions.height} 
              data={data}
              filters={filters}
              selectedNodeId={selectedNodeId}
              highlightedNodeIds={searchResults}
              onNodeClick={handleNodeClick}
              onNodeHover={setHoveredNode}
            />
          </Suspense>
        </GraphErrorBoundary>
      ) : (
        <ForceGraphWithKey 
          width={dimensions.width} 
          height={dimensions.height} 
          data={data}
          filters={filters}
          selectedNodeId={selectedNodeId}
          highlightedNodeIds={searchResults}
          onNodeClick={handleNodeClick}
          onNodeHover={setHoveredNode}
        />
      )}
      
      {/* <GraphLegend 
        showEntityTypes={true} 
        showRelationshipTypes={true} 
      /> */}
      
      <Flex position="absolute" top="4" right="4" zIndex="10" gap="2">
        <Button
          size="sm"
          colorScheme="blue"
          onClick={handleShowAllClick}
          leftIcon={<Square size={16} />}
        >
          Refresh Graph
        </Button>
        
        <ButtonGroup size="sm" isAttached variant="solid" colorScheme={colorMode === 'dark' ? 'blue' : 'brand'}>
          <Tooltip label="2D View">
            <Button 
              onClick={() => !isLoading && is3D && toggleView()} 
              isActive={!is3D}
              leftIcon={<Square size={16} />}
              isDisabled={isLoading}
            >
              2D
            </Button>
          </Tooltip>
          <Tooltip label="3D View">
            <Button 
              onClick={() => !isLoading && !is3D && toggleView()} 
              isActive={is3D}
              leftIcon={<Boxes size={16} />}
              isDisabled={isLoading}
            >
              3D
            </Button>
          </Tooltip>
        </ButtonGroup>
      </Flex>
      
      {/* Node tooltip - only show basic information */}
      {hoveredNode && (
        <Box
          position="absolute"
          top="10px"
          left="10px"
          bg={colorMode === 'dark' ? 'gray.700' : 'white'}
          p={3}
          borderRadius="md"
          boxShadow="md"
          maxW="250px"
          zIndex={1000}
        >
          <Text fontWeight="bold">{hoveredNode.name}</Text>
          <Text size="sm" color={colorMode === 'dark' ? 'gray.300' : 'gray.600'}>
            {hoveredNode.type}
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default GraphContainer;
