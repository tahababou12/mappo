import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Box, useColorMode } from '@chakra-ui/react';
import ForceGraph3D from 'react-force-graph-3d';
import { GraphData, GraphNode, GraphLink, FilterState, EntityType, RelationshipType } from '../../types';
import theme from '../../theme';
import SpriteText from 'three-spritetext';
import * as THREE from 'three';
import * as d3 from 'd3';

interface ForceGraph3DProps {
  data: GraphData;
  filters: FilterState;
  width: number;
  height: number;
  onNodeClick: (node: GraphNode) => void;
  onNodeHover: (node: GraphNode | null) => void;
  selectedNodeId: string | null;
  highlightedNodeIds: string[];
}

const ForceGraph3DComponent: React.FC<ForceGraph3DProps> = ({
  data,
  filters,
  width,
  height,
  onNodeClick,
  onNodeHover,
  selectedNodeId,
  highlightedNodeIds,
}) => {
  const graphRef = useRef<any>(null);
  const { colorMode } = useColorMode();
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [graphData, setGraphData] = useState<{ nodes: any[], links: any[] }>({ nodes: [], links: [] });
  const [initialized, setInitialized] = useState(false);

  // Filter data based on current filters
  useEffect(() => {
    const filteredNodes = data.nodes.filter(node => 
      filters.entityTypes[node.type as EntityType] && 
      (node.startDate ? 
        parseInt(node.startDate.split('-')[0]) >= filters.timeRange[0] && 
        parseInt(node.startDate.split('-')[0]) <= filters.timeRange[1] : true)
    );
    
    const nodeIds = new Set(filteredNodes.map(node => node.id));
    
    const filteredLinks = data.links.filter(link => 
      nodeIds.has(link.source as string) && 
      nodeIds.has(link.target as string) && 
      filters.relationshipTypes[link.type as RelationshipType]
    );
    
    // Create a stable layout first using D3 force simulation in 2D
    const simulation = d3.forceSimulation()
      .nodes(filteredNodes as d3.SimulationNodeDatum[])
      .force('link', d3.forceLink(filteredLinks).id((d: any) => d.id).distance(50))
      .force('charge', d3.forceManyBody().strength(-100))
      .force('center', d3.forceCenter(0, 0))
      .stop();
    
    // Run the simulation for a few iterations to get initial positions
    for (let i = 0; i < 300; i++) simulation.tick();
    
    // Prepare data for 3D graph with stable positions
    const nodes = filteredNodes.map(node => {
      // Find the node in the simulation
      const simNode = simulation.nodes().find((n: any) => n.id === node.id);
      
      return {
        ...node,
        color: (theme.colors.entityColors as Record<string, string>)[node.type],
        size: getNodeSize(node, filteredLinks, filters.nodeSizeAttribute),
        highlighted: highlightedNodeIds.includes(node.id),
        selected: node.id === selectedNodeId,
        // Use simulation positions if available, otherwise use random positions
        x: simNode ? simNode.x * 5 : (Math.random() * 200 - 100),
        y: simNode ? simNode.y * 5 : (Math.random() * 200 - 100),
        z: simNode ? 0 : (Math.random() * 200 - 100),
        // Add fixed positions for stability
        fx: simNode ? simNode.x * 5 : null,
        fy: simNode ? simNode.y * 5 : null,
        fz: null,
        // Initialize velocities to zero
        vx: 0,
        vy: 0,
        vz: 0
      };
    });
    
    const links = filteredLinks.map(link => ({
      ...link,
      color: (theme.colors.relationshipColors as Record<string, string>)[link.type],
      width: (link.strength || 1) * 2,
      // Ensure source and target are strings (IDs)
      source: typeof link.source === 'object' ? link.source.id : link.source,
      target: typeof link.target === 'object' ? link.target.id : link.target
    }));
    
    setGraphData({ nodes, links });
    setInitialized(false);
  }, [data, filters, selectedNodeId, highlightedNodeIds]);

  // Get node size based on attribute
  const getNodeSize = (node: GraphNode, links: any[], sizeAttribute: string) => {
    if (sizeAttribute === 'equal') {
      return 5;
    }
    
    const nodeLinks = links.filter(
      link => link.source === node.id || link.target === node.id
    );
    
    // Scale based on connections (degree)
    if (sizeAttribute === 'degree') {
      return Math.max(3, Math.min(8, 3 + nodeLinks.length * 0.5));
    }
    
    // For betweenness centrality, we'd need to calculate it
    // This is a simplified approximation
    if (sizeAttribute === 'betweenness') {
      const uniqueConnections = new Set();
      nodeLinks.forEach(link => {
        const otherId = link.source === node.id ? link.target : link.source;
        uniqueConnections.add(otherId);
      });
      return Math.max(3, Math.min(8, 3 + uniqueConnections.size * 0.5));
    }
    
    return 5; // Default
  };

  // Node object generation
  const nodeThreeObject = useCallback((node: any) => {
    // Use a sphere for the node
    const geometry = new THREE.SphereGeometry(node.size);
    
    // Determine color based on selection/highlight state
    let color = node.color;
    let opacity = 0.8;
    
    if (node.selected) {
      color = colorMode === 'dark' ? '#ffffff' : '#000000';
      opacity = 1;
    } else if (node.highlighted) {
      color = '#F6E05E'; // Yellow highlight
      opacity = 0.9;
    }
    
    const material = new THREE.MeshLambertMaterial({
      color: color,
      transparent: true,
      opacity: opacity
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    
    // Add text label
    const label = new SpriteText(node.name);
    label.color = colorMode === 'dark' ? '#ffffff' : '#000000';
    label.textHeight = 2;
    label.position.y = node.size + 2;
    
    // Create a group to hold both the sphere and the label
    const group = new THREE.Group();
    group.add(mesh);
    group.add(label);
    
    return group;
  }, [colorMode]);

  // Handle node click
  const handleNodeClick = useCallback((node: any) => {
    onNodeClick(node);
  }, [onNodeClick]);

  // Handle node hover
  const handleNodeHover = useCallback((node: any) => {
    setHoveredNode(node);
    onNodeHover(node);
  }, [onNodeHover]);

  // Initialize the 3D graph with stable parameters
  useEffect(() => {
    if (!graphRef.current || initialized || graphData.nodes.length === 0) return;
    
    // Wait for the graph to be rendered
    setTimeout(() => {
      if (graphRef.current) {
        // Configure forces for stability
        graphRef.current.d3Force('charge', d3.forceManyBody()
          .strength(-80)
          .distanceMax(200)
        );
        
        graphRef.current.d3Force('link', d3.forceLink(graphData.links)
          .id((d: any) => d.id)
          .distance(50)
        );
        
        graphRef.current.d3Force('center', d3.forceCenter());
        
        // Add a custom force to spread nodes in the Z dimension
        // Since d3.forceZ doesn't exist, we'll create a custom force
        graphRef.current.d3Force('z-spread', alpha => {
          const strength = 0.02;
          graphData.nodes.forEach(node => {
            if (!node.z) node.z = 0;
            // Gently push nodes toward z=0 with some randomness
            const delta = (0 - node.z) * alpha * strength + (Math.random() - 0.5) * alpha;
            node.vz += delta;
          });
        });
        
        // Add collision force to prevent overlap
        graphRef.current.d3Force('collision', d3.forceCollide(10));
        
        // Apply layout based on filters
        if (filters.layout === 'radial') {
          graphRef.current.d3Force('radial', d3.forceRadial(100).strength(0.8));
        }
        
        // Run a gentle reheat
        graphRef.current.d3ReheatSimulation();
        
        // After a short time, release fixed positions to allow some movement
        setTimeout(() => {
          if (graphRef.current) {
            graphData.nodes.forEach(node => {
              node.fx = null;
              node.fy = null;
              node.fz = null;
            });
            graphRef.current.d3ReheatSimulation();
          }
        }, 2000);
        
        setInitialized(true);
      }
    }, 500);
  }, [graphData, filters.layout, initialized]);

  return (
    <Box width="100%" height="100%" position="relative">
      {graphData.nodes.length > 0 && (
        <ForceGraph3D
          ref={graphRef}
          graphData={graphData}
          width={width}
          height={height}
          backgroundColor={colorMode === 'dark' ? '#1A202C' : '#F7FAFC'}
          nodeThreeObject={nodeThreeObject}
          onNodeClick={handleNodeClick}
          onNodeHover={handleNodeHover}
          enableNodeDrag={true}
          enableNavigationControls={true}
          showNavInfo={false}
          controlType="orbit"
          cooldownTicks={300}
          numDimensions={3}
          // Stable camera settings
          cameraPosition={{ x: 0, y: 0, z: 200 }}
          // Gentle animation
          enablePointerInteraction={true}
          // Damping to reduce oscillations
          d3VelocityDecay={0.4}
        />
      )}
    </Box>
  );
};

export default ForceGraph3DComponent;
