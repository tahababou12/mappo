import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Box, useColorMode, useTheme } from '@chakra-ui/react';
import ForceGraph3D from 'react-force-graph-3d';
import { GraphData, GraphNode, GraphLink, FilterState, EntityType, RelationshipType } from '../../types';
import { getNodeColor, getLinkColor } from '../../utils/colorUtils';
import SpriteText from 'three-spritetext';
import * as THREE from 'three';

// Custom type for 3D node with position properties
interface GraphNode3D extends GraphNode {
  x?: number;
  y?: number;
  z?: number;
  vx?: number;
  vy?: number;
  vz?: number;
  fx?: number | null;
  fy?: number | null;
  fz?: number | null;
}

// Custom type for 3D link with additional properties
interface LinkObject extends GraphLink {
  source: GraphNode3D | string;
  target: GraphNode3D | string;
  isPersonToPerson?: boolean;
}

interface ForceGraph3DComponentProps {
  data: GraphData;
  filters: FilterState;
  width: number;
  height: number;
  onNodeClick: (node: GraphNode) => void;
  onNodeHover: (node: GraphNode | null) => void;
  selectedNodeId: string | null;
  highlightedNodeIds: string[];
}

// Cache system for THREE.js objects to prevent memory leaks
const nodeObjectCache: Map<string, THREE.Mesh> = new Map();
const linkObjectCache: Map<string, THREE.Object3D> = new Map();
const geometryCache: Map<string, THREE.BufferGeometry> = new Map();
const materialCache: Map<string, THREE.Material> = new Map();

// Dispose function to clean up Three.js objects
function disposeObject(obj: THREE.Object3D): void {
  if (!obj) return;
  
  // Remove from scene
  if (obj.parent) {
    obj.parent.remove(obj);
  }
  
  // Dispose geometries
  if ((obj as THREE.Mesh).geometry) {
    (obj as THREE.Mesh).geometry.dispose();
  }
  
  // Dispose materials (might be an array or a single material)
  const materials = 
    (obj as THREE.Mesh).material 
      ? Array.isArray((obj as THREE.Mesh).material) 
        ? (obj as THREE.Mesh).material 
        : [(obj as THREE.Mesh).material]
      : [];
      
  for (const material of materials as THREE.Material[]) {
    if (material) {
      material.dispose();
    }
  }
  
  // Recursively dispose child objects
  while (obj.children.length > 0) {
    disposeObject(obj.children[0]);
  }
}

// The main 3D force graph component
const ForceGraph3DComponent: React.FC<ForceGraph3DComponentProps> = ({
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
  const nodesRef = useRef<GraphNode3D[]>([]);
  const frameRef = useRef<number>(0);
  const { colorMode } = useColorMode();
  const theme = useTheme();
  
  // Track mounted state to prevent memory leaks
  const [isMounted, setIsMounted] = useState(true);
  const isMountedRef = useRef(isMounted);
  
  useEffect(() => {
    setIsMounted(true);
    return () => {
      isMountedRef.current = false;
      
      // Cancel animation frame
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = 0;
      }
      
      // Clear caches to prevent memory leaks
      nodeObjectCache.clear();
      materialCache.clear();
      geometryCache.clear();
      
      // Force dispose any Three.js objects
      if (graphRef.current) {
        try {
          // Try to access internal dispose method if available
          if (typeof graphRef.current._destructor === 'function') {
            graphRef.current._destructor();
          }
        } catch (e) {
          console.warn('Error disposing graph:', e);
        }
      }
    };
  }, []);
  
  // Filter data based on entity type and relationship filters
  const filteredData = useMemo(() => {
    // Filter nodes by entity type
    const filteredNodes = data.nodes.filter(node => {
      if (node.type === 'person' && !filters.entityTypes.person) return false;
      if (node.type === 'organization' && !filters.entityTypes.organization) return false;
      if (node.type === 'location' && !filters.entityTypes.location) return false;
      if (node.type === 'event' && !filters.entityTypes.event) return false;
      return true;
    });
    
    // Get filtered node IDs for link filtering
    const filteredNodeIds = new Set(filteredNodes.map(node => node.id));
    
    // Filter links by relationship type and ensure both source and target nodes exist
    const filteredLinks = data.links.filter(link => {
      // Check if nodes exist in filtered set
      const sourceId = typeof link.source === 'object' ? (link.source as GraphNode).id : link.source;
      const targetId = typeof link.target === 'object' ? (link.target as GraphNode).id : link.target;
      
      if (!filteredNodeIds.has(sourceId) || !filteredNodeIds.has(targetId)) {
        return false;
      }
      
      // Filter by relationship type
      if (link.type === 'family' && !filters.relationshipTypes.family) return false;
      if (link.type === 'professional' && !filters.relationshipTypes.professional) return false;
      if (link.type === 'social' && !filters.relationshipTypes.social) return false;
      if (link.type === 'political' && !filters.relationshipTypes.political) return false;
      if (link.type === 'conflict' && !filters.relationshipTypes.conflict) return false;
      
      return true;
    });
    
    return { nodes: filteredNodes, links: filteredLinks };
  }, [data, filters]);
  
  // Create optimized node and link objects for 3D rendering
  const { nodes, links, graphData } = useMemo(() => {
    // Regenerate nodes with 3D properties
    const nodes = filteredData.nodes.map(node => {
      const node3D: GraphNode3D = { ...node };
      // Preserve existing coordinates if available
      if (nodesRef.current.length > 0) {
        const prevNode = nodesRef.current.find(n => n.id === node.id);
        if (prevNode) {
          node3D.x = prevNode.x;
          node3D.y = prevNode.y;
          node3D.z = prevNode.z;
          node3D.vx = prevNode.vx;
          node3D.vy = prevNode.vy;
          node3D.vz = prevNode.vz;
        }
      }
      return node3D;
    });
    
    // Update reference for position persistence
    nodesRef.current = nodes;
    
    // Process links with optimized relationship detection
    const links = filteredData.links.map(link => {
      const sourceId = typeof link.source === 'object' ? (link.source as GraphNode).id : link.source;
      const targetId = typeof link.target === 'object' ? (link.target as GraphNode).id : link.target;
      
      const sourceNode = nodes.find(n => n.id === sourceId);
      const targetNode = nodes.find(n => n.id === targetId);
      
      // Determine if this is a person-to-person link
      const isPersonToPerson = 
        sourceNode && 
        targetNode && 
        sourceNode.type === 'person' && 
        targetNode.type === 'person';
      
      return {
        ...link,
        source: sourceId,
        target: targetId,
        isPersonToPerson
      } as LinkObject;
    });
    
    return {
      nodes,
      links,
      graphData: { nodes, links }
    };
  }, [filteredData]);
  
  // Function to render node objects
  const nodeThreeObject = (node: GraphNode3D): THREE.Object3D => {
    const isSelected = node.id === selectedNodeId;
    const isHighlighted = highlightedNodeIds.includes(node.id);
    
    // Check cache first to reduce object creation
    const cacheKey = `${node.id}-${isSelected}-${isHighlighted}-${colorMode}`;
    if (nodeObjectCache.has(cacheKey)) {
      return nodeObjectCache.get(cacheKey)!;
    }
    
    // Get color based on node type
    const color = getNodeColor(node.type, colorMode === 'dark');
    
    // Create colored sphere
    let geometry;
    if (geometryCache.has('nodeSphere')) {
      geometry = geometryCache.get('nodeSphere')!;
    } else {
      geometry = new THREE.SphereGeometry(isSelected ? 8 : 6);
      geometryCache.set('nodeSphere', geometry);
    }
    
    // Create material with appropriate color
    const materialKey = `${color}-${isSelected}-${isHighlighted}`;
    let material;
    if (materialCache.has(materialKey)) {
      material = materialCache.get(materialKey)!;
    } else {
      material = new THREE.MeshLambertMaterial({
        color: color,
        emissive: isSelected ? color : isHighlighted ? '#888888' : '#111111',
        emissiveIntensity: isSelected ? 0.5 : isHighlighted ? 0.3 : 0.1,
        transparent: true,
        opacity: 0.9
      });
      materialCache.set(materialKey, material);
    }
    
    // Create mesh
    const mesh = new THREE.Mesh(geometry, material);
    
    // Create label for the node - always show labels
    const label = new SpriteText(node.name);
    label.color = colorMode === 'dark' ? '#ffffff' : '#000000';
    // Always use a light background in dark mode and dark background in light mode for better contrast
    label.backgroundColor = colorMode === 'dark' ? 
      (isSelected ? '#4A5568' : 'rgba(45, 55, 72, 0.7)') : 
      (isSelected ? '#E2E8F0' : 'rgba(226, 232, 240, 0.7)');
    label.padding = 2;
    label.textHeight = isSelected ? 5 : 3.5;
    label.position.y = 10;
    
    // Adjust font weight for better readability
    label.fontWeight = isSelected ? 'bold' : 'normal';
    
    // Always add the label to show names
    mesh.add(label);
    
    // Cache for reuse
    nodeObjectCache.set(cacheKey, mesh);
    
    return mesh;
  };
  
  // Handle node click
  const handleNodeClick = (node: GraphNode3D) => {
    onNodeClick(node);
  };
  
  // Handle node hover
  const handleNodeHover = (node: GraphNode3D | null) => {
    onNodeHover(node);
  };
  
  // Set up the 3D force graph with optimized renderer settings
  useEffect(() => {
    if (graphRef.current) {
      const graph = graphRef.current;
      
      // Apply optimal WebGL settings
      if (graph.renderer) {
        // Manual render loop for better control
        if (frameRef.current) {
          cancelAnimationFrame(frameRef.current);
        }
        
        // Guard against possible undefined renderer methods
        try {
          // Check if setPixelRatio exists before calling it
          if (typeof graph.renderer.setPixelRatio === 'function') {
            graph.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
          }
          
          // Check if setSize exists before calling it
          if (typeof graph.renderer.setSize === 'function') {
            graph.renderer.setSize(width, height);
          }
        } catch (error) {
          console.warn('Error configuring renderer:', error);
        }
        
        // Custom render loop with throttling
        let lastRenderTime = 0;
        const renderFrame = (time: number) => {
          frameRef.current = requestAnimationFrame(renderFrame);
          
          // Throttle to max 30fps to save resources
          if (time - lastRenderTime < 33) { // ~30fps
            return;
          }
          
          lastRenderTime = time;
          if (graph.scene && graph.camera && typeof graph.renderer.render === 'function') {
            try {
              graph.renderer.render(graph.scene, graph.camera);
            } catch (error) {
              console.warn('Error rendering 3D graph:', error);
              // Don't cancel animation frame to allow recovery on next tick
            }
          }
        };
        
        frameRef.current = requestAnimationFrame(renderFrame);
      }
      
      // Optimize but don't over-optimize physics
      if (graph.d3Force && typeof graph.d3Force === 'function') {
        try {
          const charge = graph.d3Force('charge');
          if (charge && typeof charge.strength === 'function') {
            charge.strength(-120);
          }
        } catch (error) {
          console.warn('Error configuring d3Force:', error);
        }
      }
      
      // Fix controls for smoother zooming
      if (graph.controls) {
        try {
          graph.controls.enableDamping = true;
          graph.controls.dampingFactor = 0.15;
          graph.controls.rotateSpeed = 0.7;
          graph.controls.zoomSpeed = 0.8;
          graph.controls.minDistance = 10;
          graph.controls.maxDistance = 500;
        } catch (error) {
          console.warn('Error configuring controls:', error);
        }
      }
    }
  }, [width, height]);
  
  // Cleanup 3D objects on component update
  useEffect(() => {
    if (!isMountedRef.current) return;
    
    // Provide smooth cleanup of nodes/links not in current render
    const currentNodeIds = new Set(nodes.map(n => n.id));
    const currentLinkIds = new Set(links.map(l => `${typeof l.source === 'object' ? l.source.id : l.source}-${typeof l.target === 'object' ? l.target.id : l.target}`));
    
    // Clear caches of removed objects
    nodeObjectCache.forEach((obj, key) => {
      const [nodeId] = key.split('-');
      if (!currentNodeIds.has(nodeId)) {
        disposeObject(obj);
        nodeObjectCache.delete(key);
      }
    });
    
    linkObjectCache.forEach((obj, key) => {
      const [sourceId, targetId] = key.split('-');
      const linkId = `${sourceId}-${targetId}`;
      if (!currentLinkIds.has(linkId)) {
        disposeObject(obj);
        linkObjectCache.delete(key);
      }
    });
  }, [nodes, links, isMountedRef]);
  
  return (
    <Box width={width} height={height} position="relative">
      {nodes.length > 0 ? (
        <ForceGraph3D
          ref={graphRef}
          graphData={graphData as any}
          width={width}
          height={height}
          backgroundColor={colorMode === 'dark' ? '#1A202C' : '#F7FAFC'}
          nodeThreeObject={nodeThreeObject}
          linkColor={link => getLinkColor((link as LinkObject).type, colorMode === 'dark')}
          linkWidth={link => (link as LinkObject).isPersonToPerson ? 3 : 1.5}
          linkOpacity={0.8}
          linkDirectionalParticles={4}
          linkDirectionalParticleWidth={link => (link as LinkObject).isPersonToPerson ? 3 : 2}
          linkDirectionalParticleColor={link => getLinkColor((link as LinkObject).type, colorMode === 'dark')}
          linkDirectionalParticleSpeed={0.006}
          onNodeClick={handleNodeClick}
          onNodeHover={handleNodeHover}
          nodeVal={node => node.id === selectedNodeId ? 8 : highlightedNodeIds.includes(node.id) ? 7 : 5}
          cooldownTime={3000}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
          warmupTicks={100}
          cooldownTicks={100}
          nodeOpacity={0.9}
          nodeResolution={16} // Higher resolution for smoother spheres
          onNodeDragEnd={node => {
            // Fix node position on drag end
            if (node) {
              node.fx = node.x;
              node.fy = node.y;
              node.fz = node.z;
            }
          }}
        />
      ) : (
        <Box 
          width="100%" 
          height="100%" 
          display="flex" 
          alignItems="center" 
          justifyContent="center"
          color={colorMode === 'dark' ? 'gray.300' : 'gray.600'}
        >
          No data to display with current filters
        </Box>
      )}
    </Box>
  );
};

export default ForceGraph3DComponent;

