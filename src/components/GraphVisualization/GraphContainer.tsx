import React, { useState, useEffect, useRef } from 'react';
import { Box, useColorMode, Button, ButtonGroup, Flex, Tooltip, Spinner, Text } from '@chakra-ui/react';
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
  const [is3D, setIs3D] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { colorMode } = useColorMode();

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

  const handleNodeClick = (node: GraphNode) => {
    onNodeSelect(node.id);
  };

  const toggleViewMode = () => {
    setIsLoading(true);
    // Use setTimeout to allow the UI to update before switching views
    setTimeout(() => {
      setIs3D(!is3D);
      setIsLoading(false);
    }, 100);
  };

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
      {isLoading ? (
        <Flex 
          width="100%" 
          height="100%" 
          justify="center" 
          align="center" 
          direction="column"
          gap={4}
        >
          <Spinner size="xl" color={colorMode === 'dark' ? 'blue.400' : 'brand.500'} />
          <Text>Loading {is3D ? '2D' : '3D'} view...</Text>
        </Flex>
      ) : (
        is3D ? (
          <ForceGraph3D
            data={data}
            filters={filters}
            width={dimensions.width}
            height={dimensions.height}
            onNodeClick={handleNodeClick}
            onNodeHover={setHoveredNode}
            selectedNodeId={selectedNodeId}
            highlightedNodeIds={searchResults}
          />
        ) : (
          <ForceGraph
            data={data}
            filters={filters}
            width={dimensions.width}
            height={dimensions.height}
            onNodeClick={handleNodeClick}
            onNodeHover={setHoveredNode}
            selectedNodeId={selectedNodeId}
            highlightedNodeIds={searchResults}
          />
        )
      )}
      
      <GraphLegend 
        showEntityTypes={true} 
        showRelationshipTypes={true} 
      />
      
      <Flex position="absolute" top="4" right="4" zIndex="10">
        <ButtonGroup size="sm" isAttached variant="solid" colorScheme={colorMode === 'dark' ? 'blue' : 'brand'}>
          <Tooltip label="2D View">
            <Button 
              onClick={() => !isLoading && is3D && toggleViewMode()} 
              isActive={!is3D}
              leftIcon={<Square size={16} />}
              isDisabled={isLoading}
            >
              2D
            </Button>
          </Tooltip>
          <Tooltip label="3D View">
            <Button 
              onClick={() => !isLoading && !is3D && toggleViewMode()} 
              isActive={is3D}
              leftIcon={<Boxes size={16} />}
              isDisabled={isLoading}
            >
              3D
            </Button>
          </Tooltip>
        </ButtonGroup>
      </Flex>
      
      {hoveredNode && !isLoading && (
        <Box
          position="absolute"
          top="4"
          left="4"
          bg={colorMode === 'dark' ? 'gray.700' : 'white'}
          p="3"
          borderRadius="md"
          boxShadow="md"
          zIndex="10"
        >
          <Box fontWeight="bold">{hoveredNode.name}</Box>
          <Box fontSize="sm" textTransform="capitalize">{hoveredNode.type}</Box>
        </Box>
      )}
    </Box>
  );
};

export default GraphContainer;
