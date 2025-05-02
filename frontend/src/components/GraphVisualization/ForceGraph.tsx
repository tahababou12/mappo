import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { Box, useColorMode } from '@chakra-ui/react';
import { GraphData, GraphNode, GraphLink, FilterState, EntityType, RelationshipType } from '../../types';
import theme from '../../theme';

// Add _connectedNodeIds to the existing GraphNode
interface ExtendedGraphNode extends GraphNode {
  _connectedNodeIds?: Set<string>;
}

// Add _sourceId and _targetId properties to the existing GraphLink
interface ExtendedGraphLink extends GraphLink {
  _sourceId?: string;
  _targetId?: string;
}

interface ForceGraphProps {
  data: GraphData;
  filters: FilterState;
  width: number;
  height: number;
  onNodeClick: (node: GraphNode) => void;
  onNodeHover: (node: GraphNode | null) => void;
  selectedNodeId: string | null;
  highlightedNodeIds: string[];
}

const ForceGraph: React.FC<ForceGraphProps> = ({
  data,
  filters,
  width,
  height,
  onNodeClick,
  onNodeHover,
  selectedNodeId,
  highlightedNodeIds,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);
  const nodesRef = useRef<GraphNode[]>([]);
  
  // Add refs for D3 selections to avoid recreating them
  const containerRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined>>();
  const linksGroupRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined>>();
  const nodesGroupRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined>>();
  const labelsGroupRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined>>();
  
  // Add ref to track if initialization has happened
  const isInitializedRef = useRef(false);
  
  const { colorMode } = useColorMode();

  // Filter data based on current filters
  const filteredData = React.useMemo(() => {
    console.log("ForceGraph: Filtering data with settings:", filters);
    
    // First, filter nodes based on entity types and time range
    const filteredNodes = data.nodes.filter(node => 
      filters.entityTypes[node.type as EntityType] && 
      (node.startDate ? 
        parseInt(node.startDate.split('-')[0]) >= filters.timeRange[0] && 
        parseInt(node.startDate.split('-')[0]) <= filters.timeRange[1] : true)
    );
    
    const nodeIds = new Set(filteredNodes.map(node => node.id));
    console.log(`ForceGraph: Filtered nodes count: ${filteredNodes.length}, Visible node IDs: ${nodeIds.size}`);
    
    // CRITICAL FIX: Always show all links between visible nodes, regardless of relationship filters
    // This ensures edges are ALWAYS visible no matter what filters are applied
    const allVisibleLinks = data.links.filter(link => {
      const sourceId = typeof link.source === 'object' ? (link.source as any).id : link.source;
      const targetId = typeof link.target === 'object' ? (link.target as any).id : link.target;
      
      const isVisible = nodeIds.has(sourceId) && nodeIds.has(targetId);
      
      // Detailed logging to debug link visibility issues
      if (!isVisible) {
        console.log(`Link ${sourceId}->${targetId} filtered out: source in nodes? ${nodeIds.has(sourceId)}, target in nodes? ${nodeIds.has(targetId)}`);
      }
      
      return isVisible;
    });
    
    console.log(`ForceGraph: Showing all ${allVisibleLinks.length} links between visible nodes`);
    
    // Extra safety check: If no links are found, this is probably an error
    if (allVisibleLinks.length === 0 && filteredNodes.length > 1) {
      console.warn("WARNING: No links found between nodes. This is unexpected and may indicate a filter issue!");
    }
    
    return { 
      nodes: filteredNodes, 
      links: allVisibleLinks
    };
  }, [data, filters]);

  // Cache node positions to prevent jumping
  useEffect(() => {
    // Preserve existing node positions when data changes
    if (nodesRef.current.length > 0 && filteredData.nodes.length > 0) {
      const positionMap = new Map<string, {x: number, y: number, vx: number, vy: number}>();
      
      nodesRef.current.forEach(node => {
        if (node.id && node.x !== undefined && node.y !== undefined) {
          positionMap.set(node.id, {
            x: node.x, 
            y: node.y,
            vx: node.vx || 0,
            vy: node.vy || 0
          });
        }
      });
      
      // Apply cached positions to new nodes
      filteredData.nodes.forEach(node => {
        const cached = positionMap.get(node.id);
        if (cached) {
          node.x = cached.x;
          node.y = cached.y;
          node.vx = cached.vx;
          node.vy = cached.vy;
          node.fx = null; // Clear fixed position if any
          node.fy = null;
        }
      });
    }
    
    // Update the reference
    nodesRef.current = filteredData.nodes as GraphNode[];
  }, [filteredData]);

  // OPTIMIZATION: Split the graph creation and update phases
  // Phase 1: Initialize the SVG and container elements only once
  useEffect(() => {
    if (!svgRef.current || isInitializedRef.current) return;
    
    console.log("ForceGraph: Initializing SVG container (one-time setup)");
    isInitializedRef.current = true;
    
    // Setup the SVG only once
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height])
      .attr('style', 'max-width: 100%; height: auto;');
      
    // Add zoom functionality
    const g = svg.append('g');
    
    // Improved zoom behavior that keeps content within the canvas
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 8])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    
    svg.call(zoom)
      .on('dblclick.zoom', null); // Disable double-click zoom for better UX
    
    // Set initial zoom transform position in center
    svg.call(zoom.transform, d3.zoomIdentity.translate(0, 0).scale(1));
    
    // Store references to container groups to update them later
    containerRef.current = g;
    
    // Create groups for different graph elements
    linksGroupRef.current = g.append('g')
      .attr('class', 'links-group');
      
    nodesGroupRef.current = g.append('g')
      .attr('class', 'nodes-group');
      
    labelsGroupRef.current = g.append('g')
      .attr('class', 'labels-group');
    
    // Add marker definitions for arrows
    svg.append('defs').selectAll('marker')
      .data(['standard', 'person-to-person']) // Different marker types
      .enter().append('marker')
      .attr('id', d => `arrow-${d}`)
      .attr('viewBox', `0 -${5/2} ${5} ${5}`)
      .attr('refX', 5 + 11) // Position the arrow at the end of the link
      .attr('refY', 0)
      .attr('markerWidth', 5)
      .attr('markerHeight', 5)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', `M0,-${5/2}L${5},0L0,${5/2}`)
      .attr('fill', d => d === 'person-to-person' ? 
        (colorMode === 'dark' ? '#90CDF4' : '#3182CE') : // Blue for person-to-person
        (colorMode === 'dark' ? '#A0AEC0' : '#718096')); // Gray for other relationships
    
    // Add background click to deselect
    svg.on('click', function(event) {
      // Only if clicking directly on SVG background (not a node)
      if (event.target === svgRef.current) {
        onNodeClick({ id: '', name: '', type: 'person' });
      }
    });
    
    // Cleanup
    return () => {
      // Reset initialization flag on unmount
      isInitializedRef.current = false;
      
      // Clear all groups on unmount
      if (containerRef.current) {
        containerRef.current.selectAll('*').remove();
      }
      
      // Stop simulation
      if (simulationRef.current) {
        simulationRef.current.stop();
        simulationRef.current = null;
      }
    };
  }, []); // Empty dependency array - truly run only once
  
  // Update SVG dimensions when size changes
  useEffect(() => {
    if (!svgRef.current || !isInitializedRef.current) return;
    
    // Update SVG dimensions when width/height change
    d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);
      
    // Update center force if simulation exists
    if (simulationRef.current) {
      simulationRef.current
        .force('center', d3.forceCenter(width / 2, height / 2))
        .alpha(0.1)
        .restart();
    }
  }, [width, height]);

  // Phase 2: Update data in the simulation and DOM elements
  useEffect(() => {
    if (!isInitializedRef.current || !containerRef.current || !linksGroupRef.current || 
        !nodesGroupRef.current || !labelsGroupRef.current) return;
    
    console.log("ForceGraph: Updating graph data with", filteredData.nodes.length, "nodes and", filteredData.links.length, "links");
    
    // Pre-process links for better performance
    const processedLinks = filteredData.links.map(link => {
      const processedLink = link as ExtendedGraphLink;
      processedLink._sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      processedLink._targetId = typeof link.target === 'object' ? link.target.id : link.target;
      return processedLink;
    });
    
    // Pre-process nodes to add connected node cache
    const processedNodes = filteredData.nodes.map(node => {
      const processedNode = node as ExtendedGraphNode;
      const connectedNodes = new Set(
        processedLinks
          .filter(link => link._sourceId === node.id || link._targetId === node.id)
          .flatMap(link => [link._sourceId, link._targetId])
          .filter(id => id !== node.id)
      );
      processedNode._connectedNodeIds = connectedNodes;
      return processedNode;
    });
    
    // Create/update links with D3's join pattern
    const linkSelection = linksGroupRef.current
      .selectAll('path.link')
      .data(processedLinks, (d: any) => `${d._sourceId}-${d._targetId}`);
      
    // Remove old links
    linkSelection.exit().remove();
    
    // Add new links
    const newLinks = linkSelection.enter()
      .append('path')
      .attr('class', 'link')
      .attr('fill', 'none');
      
    // Update all links (new and existing)
    const allLinks = newLinks.merge(linkSelection as any)
      .attr('stroke-width', d => (d.strength || 1) * 1.5)
      .attr('stroke', d => (theme.colors.relationshipColors as Record<string, string>)[d.type])
      .attr('stroke-dasharray', d => {
        if (d.type === 'conflict') return '5,5';
        const relationshipEnabled = filters.relationshipTypes[d.type as RelationshipType];
        if (!relationshipEnabled) return '2,2';
        return null;
      })
      .attr('marker-end', d => {
        const sourceNode = filteredData.nodes.find(n => n.id === (typeof d.source === 'object' ? d.source.id : d.source));
        const targetNode = filteredData.nodes.find(n => n.id === (typeof d.target === 'object' ? d.target.id : d.target));
        
        if (sourceNode && targetNode && sourceNode.type === 'person' && targetNode.type === 'person') {
          return 'url(#arrow-person-to-person)';
        }
        
        return 'url(#arrow-standard)';
      });
      
    // Create/update nodes with D3's join pattern
    const nodeSelection = nodesGroupRef.current
      .selectAll('circle.node')
      .data(processedNodes, (d: any) => d.id);
      
    // Remove old nodes
    nodeSelection.exit().remove();
    
    // Add new nodes
    const newNodes = nodeSelection.enter()
      .append('circle')
      .attr('class', 'node')
      .call(drag() as any);
      
    // Add event handlers only to new nodes
    newNodes
      .on('click', function(event, d) {
        event.stopPropagation();
        event.preventDefault();
        
        if (selectedNodeId === d.id) {
          onNodeClick({ id: '', name: '', type: 'person' });
        } else {
          onNodeClick(d);
        }
        
        return false;
      }, { capture: true })
      .on('mouseover', (_, d) => {
        onNodeHover(d);
      })
      .on('mouseout', () => {
        onNodeHover(null);
      })
      .append('title')
      .text(d => `${d.name} (${d.type})`);
      
    // Update all nodes (new and existing)
    const allNodes = newNodes.merge(nodeSelection as any)
      .attr('r', d => {
        if (filters.nodeSizeAttribute === 'equal') {
          return 10;
        }
        
        const nodeLinks = processedLinks.filter(
          link => link._sourceId === d.id || link._targetId === d.id
        );
        
        if (filters.nodeSizeAttribute === 'degree') {
          return Math.max(8, Math.min(20, 6 + nodeLinks.length * 1.2));
        }
        
        if (filters.nodeSizeAttribute === 'betweenness') {
          const uniqueConnections = new Set();
          nodeLinks.forEach(link => {
            const otherId = link._sourceId === d.id ? link._targetId : link._sourceId;
            uniqueConnections.add(otherId);
          });
          return Math.max(8, Math.min(20, 6 + uniqueConnections.size * 1.2));
        }
        
        return 10;
      })
      .attr('fill', d => {
        if (filters.showCommunities && highlightedNodeIds.includes(d.id)) {
          return '#F6E05E';
        }
        return (theme.colors.entityColors as Record<string, string>)[d.type];
      })
      .attr('stroke', d => {
        if (d.id === selectedNodeId) {
          return colorMode === 'dark' ? 'white' : 'black';
        }
        if (highlightedNodeIds.includes(d.id)) {
          return '#F6E05E';
        }
        return colorMode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
      })
      .attr('stroke-width', d => d.id === selectedNodeId ? 4 : highlightedNodeIds.includes(d.id) ? 3 : 1.5);
      
    // Create/update labels with D3's join pattern
    const labelSelection = labelsGroupRef.current
      .selectAll('text')
      .data(processedNodes, (d: any) => d.id);
      
    // Remove old labels
    labelSelection.exit().remove();
    
    // Add new labels
    const newLabels = labelSelection.enter()
      .append('text')
      .attr('dy', '.35em')
      .style('pointer-events', 'none')
      .style('text-shadow', colorMode === 'dark' 
        ? '0 0 3px rgba(0,0,0,0.8), 0 0 2px rgba(0,0,0,0.9)' 
        : '0 0 3px rgba(255,255,255,0.8), 0 0 2px rgba(255,255,255,0.9)');
      
    // Update all labels (new and existing)
    const allLabels = newLabels.merge(labelSelection as any)
      .attr('dx', d => {
        const nodeLinks = processedLinks.filter(
          link => link._sourceId === d.id || link._targetId === d.id
        );
        const size = Math.max(8, Math.min(20, 6 + nodeLinks.length * 1.2));
        return size + 5;
      })
      .text(d => d.name)
      .attr('font-size', d => {
        if (d.id === selectedNodeId) return '14px';
        if (highlightedNodeIds.includes(d.id)) return '12px';
        return '11px';
      })
      .attr('font-weight', d => 
        d.id === selectedNodeId ? 'bold' : highlightedNodeIds.includes(d.id) ? 'semibold' : 'normal'
      )
      .attr('fill', d => {
        if (d.id === selectedNodeId) {
          return colorMode === 'dark' ? '#FFFFFF' : '#000000';
        }
        return colorMode === 'dark' ? '#E2E8F0' : '#2D3748';
      });
    
    // Create or update the simulation
    if (!simulationRef.current) {
      // Create new simulation if none exists
      simulationRef.current = d3.forceSimulation<any>(processedNodes)
        .force('link', d3.forceLink<any, any>(processedLinks)
          .id((d: any) => d.id)
          .distance(150)
        )
        .force('charge', d3.forceManyBody()
          .strength(-200)
          .distanceMax(500)
          .theta(0.8)
        )
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(25).strength(0.7))
        .velocityDecay(0.7)
        .alphaDecay(0.01)
        .alphaMin(0.001)
        .alpha(0.2);
    } else {
      // Update existing simulation with new data
      simulationRef.current
        .nodes(processedNodes)
        .force('link', d3.forceLink<any, any>(processedLinks)
          .id((d: any) => d.id)
          .distance(150)
        );
        
      // Gently restart simulation
      simulationRef.current.alpha(0.1).restart();
    }
    
    // Update tick function (single definition instead of recreating each time)
    simulationRef.current.on('tick', () => {
      // Skip updates on some ticks for better performance with large graphs
      const tickCount = (simulationRef.current as any)._tickCount || 0;
      (simulationRef.current as any)._tickCount = tickCount + 1;
      
      // Only update visuals every 3 ticks for all graph sizes to reduce flickering
      if (tickCount % 3 !== 0) return;
      
      // Constrain nodes to visible area
      processedNodes.forEach(node => {
        const r = 1;
        if (node.x) node.x = Math.max(r, Math.min(width - r, node.x));
        if (node.y) node.y = Math.max(r, Math.min(height - r, node.y));
      });
      
      // Update positions
      allLinks.attr('d', d => {
        const sourceNode = d.source as GraphNode;
        const targetNode = d.target as GraphNode;
        
        const sourceX = sourceNode.x || width / 2;
        const sourceY = sourceNode.y || height / 2;
        const targetX = targetNode.x || width / 2;
        const targetY = targetNode.y || height / 2;
        
        const sourceIsPerson = filteredData.nodes.find(n => n.id === sourceNode.id)?.type === 'person';
        const targetIsPerson = filteredData.nodes.find(n => n.id === targetNode.id)?.type === 'person';
        
        if (sourceIsPerson && targetIsPerson) {
          const dx = targetX - sourceX;
          const dy = targetY - sourceY;
          const dr = Math.sqrt(dx * dx + dy * dy) * 1.2;
          return `M${sourceX},${sourceY}A${dr},${dr} 0 0,1 ${targetX},${targetY}`;
        }
        
        return `M${sourceX},${sourceY}L${targetX},${targetY}`;
      });
      
      allNodes
        .attr('cx', d => d.x || 0)
        .attr('cy', d => d.y || 0);
        
      allLabels
        .attr('x', d => d.x || 0)
        .attr('y', d => d.y || 0);
    });
    
    // Set up cooling schedule once instead of on every data update
    if (!(simulationRef.current as any)._coolingScheduled) {
      (simulationRef.current as any)._coolingScheduled = true;
      
      // Gentler cooling schedule with lower alpha values
      setTimeout(() => {
        if (simulationRef.current) simulationRef.current.alphaTarget(0.05).alpha(0.1);
        
        setTimeout(() => {
          if (simulationRef.current) simulationRef.current.alphaTarget(0.01).alpha(0.05);
          
          setTimeout(() => {
            if (simulationRef.current) simulationRef.current.alphaTarget(0).alpha(0.001);
          }, 10000); // Longer final cooling phase
        }, 7000);  // Longer intermediate cooling phase
      }, 3000);    // Longer initial cooling phase
    }
    
    // Clean up unnecessary memory in nodes
    processedNodes.forEach(node => {
      delete (node as any).description;
      delete (node as any).metadata;
    });
    
    // Update opacities based on selection
    updateNodeAndLinkVisibility();
    
  }, [filteredData, width, height, colorMode, filters.nodeSizeAttribute, filters.showCommunities, highlightedNodeIds]);
  
  // Apply visibility updates when selection changes (lightweight function that doesn't recreate elements)
  const updateNodeAndLinkVisibility = useCallback(() => {
    if (!nodesGroupRef.current || !linksGroupRef.current || !labelsGroupRef.current) return;
    
    // Update node visibility
    nodesGroupRef.current.selectAll('circle.node')
      .style('opacity', (d: any) => {
        if (!selectedNodeId) return 1.0;
        
        // Selected node is always visible
        if (d.id === selectedNodeId) return 1.0;
        
        // Check if connected to selected node
        const isConnected = (d._connectedNodeIds as Set<string>)?.has(selectedNodeId);
        return isConnected ? 1.0 : 0.2;
      });
    
    // Update link visibility
    linksGroupRef.current.selectAll('path.link')
      .style('opacity', (d: any) => {
        if (!selectedNodeId) {
          // Normal filtering when no node is selected
          const relationshipEnabled = filters.relationshipTypes[d.type as RelationshipType];
          return relationshipEnabled ? 0.7 : 0.3;
        }
        
        // When node is selected, highlight its connections
        const isConnected = d._sourceId === selectedNodeId || d._targetId === selectedNodeId;
        return isConnected ? 1.0 : 0.1;
      });
    
    // Update label visibility
    labelsGroupRef.current.selectAll('text')
      .style('opacity', (d: any) => {
        if (d.id === selectedNodeId) return 1.0;
        if (highlightedNodeIds.includes(d.id)) return 0.95;
        
        if (selectedNodeId) {
          const isConnected = (d._connectedNodeIds as Set<string>)?.has(selectedNodeId);
          return isConnected ? 0.95 : 0.1;
        }
        
        return 0.85;
      });
  }, [selectedNodeId, highlightedNodeIds, filters.relationshipTypes]);
  
  // Effect for selected node changes (without redrawing the graph)
  useEffect(() => {
    updateNodeAndLinkVisibility();
  }, [selectedNodeId, highlightedNodeIds, updateNodeAndLinkVisibility]);

  // Effect for relationship filter changes (without redrawing the graph)
  useEffect(() => {
    if (linksGroupRef.current) {
      linksGroupRef.current.selectAll('path.link')
        .attr('stroke-dasharray', (d: any) => {
          if (d.type === 'conflict') return '5,5';
          const relationshipEnabled = filters.relationshipTypes[d.type as RelationshipType];
          if (!relationshipEnabled) return '2,2';
          return null;
        });
    }
    
    updateNodeAndLinkVisibility();
  }, [filters.relationshipTypes, updateNodeAndLinkVisibility]);

  // Update simulation when layout changes
  useEffect(() => {
    const simulation = simulationRef.current;
    if (!simulation) return;

    simulation.alpha(0.3);

    switch (filters.layout) {
      case 'force':
        simulation
          .force('center', d3.forceCenter(width / 2, height / 2))
          .force('charge', d3.forceManyBody()
            .strength(-150)
            .distanceMax(350)
          )
          .force('stabilize', d3.forceRadial(0, width / 2, height / 2).strength(0.01))
          .restart();
        break;
      case 'radial':
        simulation
          .force('center', null)
          .force('charge', d3.forceManyBody().strength(-150))
          .force('r', d3.forceRadial(Math.min(width, height) / 3, width / 2, height / 2).strength(0.6))
          .restart();
        break;
      case 'hierarchical':
        simulation
          .force('center', null)
          .force('charge', d3.forceManyBody().strength(-100))
          .force('x', d3.forceX(width / 2).strength(0.2))
          .force('y', d3.forceY().y(d => {
            switch (d.type) {
              case 'person': return height * 0.3;
              case 'organization': return height * 0.5;
              case 'event': return height * 0.7;
              case 'location': return height * 0.9;
              default: return height / 2;
            }
          }).strength(0.3))
          .restart();
        break;
    }
    
    // Gradually stop after transition
    setTimeout(() => {
      if (simulation) simulation.alphaTarget(0.01);
      setTimeout(() => { if (simulation) simulation.alphaTarget(0); }, 2000);
    }, 3000);
  }, [filters.layout, width, height]);

  // Improved drag functionality with better stability
  function drag() {
    function dragstarted(event: any) {
      if (!event.active && simulationRef.current) {
        simulationRef.current.alphaTarget(0.1).restart();
      }
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }
    
    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }
    
    function dragended(event: any) {
      if (!event.active && simulationRef.current) {
        simulationRef.current.alphaTarget(0);
      }
      // Don't reset fx/fy to allow for pinning nodes in place
      // Only reset if SHIFT key is not pressed
      if (!event.sourceEvent.shiftKey) {
        event.subject.fx = null;
        event.subject.fy = null;
      }
    }
    
    return d3.drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended);
  }

  return (
    <Box width="100%" height="100%" overflow="hidden" position="relative" border="none">
      <svg ref={svgRef} width={width} height={height} style={{ border: 'none', overflow: 'visible' }} />
    </Box>
  );
};

export default ForceGraph;
