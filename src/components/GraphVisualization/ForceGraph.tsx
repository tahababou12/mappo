import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { Box, useColorMode } from '@chakra-ui/react';
import { GraphData, GraphNode, GraphLink, FilterState, EntityType, RelationshipType } from '../../types';
import theme from '../../theme';

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

  // Create and update the force graph
  useEffect(() => {
    if (!svgRef.current) return;
    
    console.log("ForceGraph: Redrawing graph with", filteredData.nodes.length, "nodes and", filteredData.links.length, "links");

    // Clear previous graph
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height])
      .attr('style', 'max-width: 100%; height: auto;');

    // Add zoom functionality with smoother transitions
    const g = svg.append('g');
    
    svg.call(
      d3.zoom<SVGSVGElement, unknown>()
        .extent([[0, 0], [width, height]])
        .scaleExtent([0.1, 8])
        .on('zoom', (event) => {
          g.attr('transform', event.transform);
        })
    )
    .on('dblclick.zoom', null); // Disable double-click zoom for better UX

    // Add grid lines for reference (optional)
    if (colorMode === 'dark') {
      const gridSize = 50;
      const gridColor = 'rgba(255, 255, 255, 0.05)';
      
      // Horizontal grid lines
      g.append('g')
        .selectAll('line')
        .data(d3.range(0, height, gridSize))
        .join('line')
        .attr('x1', 0)
        .attr('y1', d => d)
        .attr('x2', width)
        .attr('y2', d => d)
        .attr('stroke', gridColor)
        .attr('stroke-width', 1);
      
      // Vertical grid lines
      g.append('g')
        .selectAll('line')
        .data(d3.range(0, width, gridSize))
        .join('line')
        .attr('x1', d => d)
        .attr('y1', 0)
        .attr('x2', d => d)
        .attr('y2', height)
        .attr('stroke', gridColor)
        .attr('stroke-width', 1);
    }

    // Define arrow markers for directional links
    const arrowSize = 5;
    
    // Add marker definitions for arrows
    svg.append('defs').selectAll('marker')
      .data(['standard', 'person-to-person']) // Different marker types
      .enter().append('marker')
      .attr('id', d => `arrow-${d}`)
      .attr('viewBox', `0 -${arrowSize/2} ${arrowSize} ${arrowSize}`)
      .attr('refX', arrowSize + 11) // Position the arrow at the end of the link, accounting for node radius
      .attr('refY', 0)
      .attr('markerWidth', arrowSize)
      .attr('markerHeight', arrowSize)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', `M0,-${arrowSize/2}L${arrowSize},0L0,${arrowSize/2}`)
      .attr('fill', d => d === 'person-to-person' ? 
        (colorMode === 'dark' ? '#90CDF4' : '#3182CE') : // Blue for person-to-person
        (colorMode === 'dark' ? '#A0AEC0' : '#718096')); // Gray for other relationships

    // Create path elements for links (instead of lines) to support arrows
    const link = g.append('g')
      .attr('stroke-opacity', 0.6)
      .attr('class', 'links-group') // Add class for easier selection
      .selectAll('path')
      .data(filteredData.links)
      .join('path')
      .attr('class', 'link') // Add class for easier selection
      .attr('stroke-width', d => (d.strength || 1) * 1.5)
      .attr('stroke', d => (theme.colors.relationshipColors as Record<string, string>)[d.type])
      .attr('stroke-dasharray', d => {
        // Show dashed line for conflict relationship type
        if (d.type === 'conflict') return '5,5';
        
        // Show dotted line for relationships that are filtered out
        const relationshipEnabled = filters.relationshipTypes[d.type as RelationshipType];
        if (!relationshipEnabled) return '2,2';
        
        // Solid line for enabled relationships
        return null;
      })
      .attr('fill', 'none')
      .style('visibility', 'visible') // Force visibility to be always visible
      .style('opacity', d => {
        // If a node is selected, highlight its connected links
        if (selectedNodeId) {
          const sourceId = typeof d.source === 'object' ? d.source.id : d.source;
          const targetId = typeof d.target === 'object' ? d.target.id : d.target;
          
          // Show links connected to the selected node with full opacity
          const isConnected = sourceId === selectedNodeId || targetId === selectedNodeId;
          return isConnected ? 1.0 : 0.1; // Connected links are visible, others faded
        }
        
        // Apply relationship type filter by adjusting opacity rather than removing links
        const relationshipEnabled = filters.relationshipTypes[d.type as RelationshipType];
        if (!relationshipEnabled) {
          return 0.3; // Show filtered relationships with reduced but still visible opacity
        }
        
        // No node selected - all links have default opacity
        return 0.7;
      })
      .attr('marker-end', d => {
        // Check if both source and target are person entities
        const sourceNode = filteredData.nodes.find(n => n.id === (typeof d.source === 'object' ? d.source.id : d.source));
        const targetNode = filteredData.nodes.find(n => n.id === (typeof d.target === 'object' ? d.target.id : d.target));
        
        if (sourceNode && targetNode && sourceNode.type === 'person' && targetNode.type === 'person') {
          return 'url(#arrow-person-to-person)';
        }
        
        return 'url(#arrow-standard)';
      });

    // Create the nodes with improved sizing
    const node = g.append('g')
      .selectAll('circle')
      .data(filteredData.nodes)
      .join('circle')
      .attr('r', d => {
        // Base size on node degree or selected attribute
        if (filters.nodeSizeAttribute === 'equal') {
          return 10; // Increased base size
        }
        
        const nodeLinks = filteredData.links.filter(
          link => {
            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
            return sourceId === d.id || targetId === d.id;
          }
        );
        
        // Scale based on connections (degree)
        if (filters.nodeSizeAttribute === 'degree') {
          return Math.max(8, Math.min(20, 6 + nodeLinks.length * 1.2)); // Increased scaling
        }
        
        // For betweenness centrality, we'd need to calculate it
        // This is a simplified approximation
        if (filters.nodeSizeAttribute === 'betweenness') {
          const uniqueConnections = new Set();
          nodeLinks.forEach(link => {
            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
            const otherId = sourceId === d.id ? targetId : sourceId;
            uniqueConnections.add(otherId);
          });
          return Math.max(8, Math.min(20, 6 + uniqueConnections.size * 1.2)); // Increased scaling
        }
        
        return 10; // Increased default size
      })
      .attr('fill', d => {
        // If showing communities and the node is highlighted
        if (filters.showCommunities && highlightedNodeIds.includes(d.id)) {
          return '#F6E05E'; // Yellow for highlighted community
        }
        return (theme.colors.entityColors as Record<string, string>)[d.type];
      })
      .attr('stroke', d => {
        if (d.id === selectedNodeId) {
          return colorMode === 'dark' ? 'white' : 'black';
        }
        if (highlightedNodeIds.includes(d.id)) {
          return '#F6E05E'; // Yellow highlight
        }
        return colorMode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'; // Increased stroke opacity
      })
      .attr('stroke-width', d => d.id === selectedNodeId ? 4 : highlightedNodeIds.includes(d.id) ? 3 : 1.5) // Thicker strokes
      .style('opacity', d => {
        // If a node is selected, show connected nodes with full opacity, others faded
        if (selectedNodeId) {
          // The selected node should be fully visible
          if (d.id === selectedNodeId) return 1.0;
          
          // Check if this node is connected to the selected node
          const isConnected = filteredData.links.some(link => {
            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
            return (sourceId === selectedNodeId && targetId === d.id) || 
                   (sourceId === d.id && targetId === selectedNodeId);
          });
          
          // Connected nodes get full opacity, others are faded
          return isConnected ? 1.0 : 0.2;
        }
        
        // No node selected - show all with full opacity
        return 1.0;
      }) 
      .call(drag() as any);

    // Add node labels with improved positioning and readability
    const labels = g.append('g')
      .selectAll('text')
      .data(filteredData.nodes)
      .join('text')
      .attr('dx', d => {
        // Adjust label position based on node size
        const nodeLinks = filteredData.links.filter(
          link => {
            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
            return sourceId === d.id || targetId === d.id;
          }
        );
        const size = Math.max(8, Math.min(20, 6 + nodeLinks.length * 1.2));
        return size + 5; // Position label outside the node
      })
      .attr('dy', '.35em')
      .text(d => d.name)
      .attr('font-size', d => {
        // Adjust font size based on node importance
        if (d.id === selectedNodeId) return '14px';
        if (highlightedNodeIds.includes(d.id)) return '12px';
        return '11px';
      })
      .attr('font-weight', d => 
        d.id === selectedNodeId ? 'bold' : highlightedNodeIds.includes(d.id) ? 'semibold' : 'normal'
      )
      .attr('fill', d => {
        // Better label color contrast
        if (d.id === selectedNodeId) {
          return colorMode === 'dark' ? '#FFFFFF' : '#000000';
        }
        return colorMode === 'dark' ? '#E2E8F0' : '#2D3748';
      })
      .style('pointer-events', 'none')
      .style('opacity', d => {
        if (d.id === selectedNodeId) return 1;
        if (highlightedNodeIds.includes(d.id)) return 0.95;
        
        // If a node is selected, highlight connected nodes' labels and fade others
        if (selectedNodeId) {
          // Check if this node is connected to the selected node
          const isConnected = filteredData.links.some(link => {
            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
            return (sourceId === selectedNodeId && targetId === d.id) || 
                  (sourceId === d.id && targetId === selectedNodeId);
          });
          
          // Connected node labels are more visible than unconnected ones
          return isConnected ? 0.95 : 0.1;
        }
        
        return 0.85; // Default opacity for labels when no node is selected
      })
      .style('text-shadow', colorMode === 'dark' 
        ? '0 0 3px rgba(0,0,0,0.8), 0 0 2px rgba(0,0,0,0.9)' 
        : '0 0 3px rgba(255,255,255,0.8), 0 0 2px rgba(255,255,255,0.9)'
      ); // Add text shadow for better readability

    // Add tooltips
    node.append('title')
      .text(d => `${d.name} (${d.type})`);

    // Add click event
    node.on('click', (event, d) => {
      event.stopPropagation();
      onNodeClick(d);
    });

    // Add hover event
    node.on('mouseover', (_, d) => {
      onNodeHover(d);
    }).on('mouseout', () => {
      onNodeHover(null);
    });

    // Add background click to deselect
    svg.on('click', () => {
      onNodeClick({ id: '', name: '', type: 'person' });
    });

    // Create the simulation with optimized parameters for stability
    const sim = d3.forceSimulation<GraphNode, GraphLink>(filteredData.nodes as GraphNode[])
      .force('link', d3.forceLink<GraphNode, GraphLink>(filteredData.links as GraphLink[])
        .id(d => d.id)
        .distance(150) // Increased spacing between nodes
      )
      .force('charge', d3.forceManyBody()
        .strength(-200) // Stronger repulsion
        .distanceMax(450) // Extended distance of effect
        .theta(0.9) // Improved accuracy of force approximation
      )
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(35).strength(0.8)) // Larger collision radius
      .velocityDecay(0.65) // Higher decay for smoother motion
      .alphaDecay(0.006) // Slower decay for smoother settling
      .alphaMin(0.0005) // Lower minimum to allow more settling time
      .alpha(0.3); // Lower initial alpha for gentler start

    // Prevent memory leaks by removing unnecessary properties
    filteredData.nodes.forEach(node => {
      // Delete unused properties to save memory
      delete (node as any).description;
      delete (node as any).metadata;
    });

    // Optimize for memory usage by using fewer tick iterations
    sim.on('tick', () => {
      // Only update node positions every few ticks for performance
      const tickCount = (sim as any)._tickCount || 0;
      (sim as any)._tickCount = tickCount + 1;
      
      // Skip updates on some ticks to improve performance
      if (tickCount % 2 !== 0 && filteredData.nodes.length > 200) return;
      
      // Constrain nodes to the visible area with some padding
      filteredData.nodes.forEach(node => {
        const r = 10; // Node radius + padding
        if (node.x) node.x = Math.max(r, Math.min(width - r, node.x));
        if (node.y) node.y = Math.max(r, Math.min(height - r, node.y));
        
        // Apply small random jitter if nodes are overlapping exactly (rare case)
        filteredData.nodes.forEach(otherNode => {
          if (node !== otherNode && node.x === otherNode.x && node.y === otherNode.y) {
            node.x += (Math.random() - 0.5) * 5;
            node.y += (Math.random() - 0.5) * 5;
          }
        });
      });

      // Update the paths for links with curves for arrows
      link.attr('d', d => {
        const sourceNode = d.source as GraphNode;
        const targetNode = d.target as GraphNode;
        
        // Use position or default to center if undefined
        const sourceX = sourceNode.x || width / 2;
        const sourceY = sourceNode.y || height / 2;
        const targetX = targetNode.x || width / 2;
        const targetY = targetNode.y || height / 2;
        
        // For links between people, draw a slight curve for better arrow visibility
        const sourceIsPerson = filteredData.nodes.find(n => n.id === sourceNode.id)?.type === 'person';
        const targetIsPerson = filteredData.nodes.find(n => n.id === targetNode.id)?.type === 'person';
        
        if (sourceIsPerson && targetIsPerson) {
          // Calculate the midpoint with a slight offset for curved path
          const dx = targetX - sourceX;
          const dy = targetY - sourceY;
          const dr = Math.sqrt(dx * dx + dy * dy) * 1.2; // Curve factor (higher = more curve)
          
          // Create a slight curved path for the arrow
          return `M${sourceX},${sourceY}A${dr},${dr} 0 0,1 ${targetX},${targetY}`;
        }
        
        // For other links, use straight lines
        return `M${sourceX},${sourceY}L${targetX},${targetY}`;
      });

      // Update node positions with smooth transitions
      node
        .attr('cx', d => d.x || 0)
        .attr('cy', d => d.y || 0);

      // Update label positions
      labels
        .attr('x', d => d.x || 0)
        .attr('y', d => d.y || 0);
    });

    // Gradually cool down the simulation to reduce perpetual motion
    setTimeout(() => {
      sim.alphaTarget(0.05).alpha(0.1);
      
      setTimeout(() => {
        sim.alphaTarget(0.01);
        
        setTimeout(() => {
          sim.alphaTarget(0).alpha(0.005);
        }, 5000);
      }, 3000);
    }, 1000);

    // Store the simulation reference for updates
    simulationRef.current = sim;

    // Cleanup
    return () => {
      sim.stop();
    };
  }, [filteredData, width, height, colorMode, selectedNodeId, highlightedNodeIds, onNodeClick, onNodeHover, filters.showCommunities, filters.nodeSizeAttribute]);

  // Update simulation when layout changes with smooth transitions
  useEffect(() => {
    const simulation = simulationRef.current;
    if (!simulation) return;

    // Save current positions
    const positions = new Map();
    nodesRef.current.forEach(node => {
      if (node.id && node.x !== undefined && node.y !== undefined) {
        positions.set(node.id, { x: node.x, y: node.y });
      }
    });

    // Gradually transition to new layout
    simulation.alpha(0.3); // Restart with medium energy

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
          .force('charge', d3.forceManyBody().strength(-100))
          .force('r', d3.forceRadial(Math.min(width, height) / 4, width / 2, height / 2).strength(0.8))
          .restart();
        break;
      case 'hierarchical':
        simulation
          .force('center', null)
          .force('charge', d3.forceManyBody().strength(-100))
          .force('x', d3.forceX(width / 2).strength(0.2))
          .force('y', d3.forceY().y(d => {
            // Simple hierarchical layout based on node type
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
    
    // Gradually stop the simulation after transition
    setTimeout(() => {
      simulation.alphaTarget(0.01);
      setTimeout(() => simulation.alphaTarget(0), 2000);
    }, 3000);
  }, [filters.layout, width, height]);

  // Always redraw when filters change to ensure edges are properly displayed
  useEffect(() => {
    if (simulationRef.current) {
      // When filters change, reheat the simulation slightly to adjust positions
      simulationRef.current.alpha(0.1).restart();
    }
  }, [filters.relationshipTypes, filters.entityTypes]);

  // Additional effect to ensure edges remain visible after selecting a node
  useEffect(() => {
    if (svgRef.current) {
      // Update edge visibility whenever selected node changes
      d3.select(svgRef.current)
        .selectAll('path')
        .style('opacity', (d: any) => {
          // If a node is selected, highlight its connected links
          if (selectedNodeId) {
            const sourceId = typeof d.source === 'object' ? d.source.id : d.source;
            const targetId = typeof d.target === 'object' ? d.target.id : d.target;
            
            // Show links connected to the selected node with full opacity
            const isConnected = sourceId === selectedNodeId || targetId === selectedNodeId;
            return isConnected ? 1.0 : 0.1; 
          }
          
          // If there are highlighted nodes from search, highlight their links too
          if (highlightedNodeIds.length > 0) {
            const sourceId = typeof d.source === 'object' ? d.source.id : d.source;
            const targetId = typeof d.target === 'object' ? d.target.id : d.target;
            
            // Show links connected to any highlighted node with full opacity
            const isConnected = 
              highlightedNodeIds.includes(sourceId) || 
              highlightedNodeIds.includes(targetId);
            
            return isConnected ? 1.0 : 0.1;
          }
          
          // Apply relationship type filter by adjusting opacity
          const relationshipEnabled = filters.relationshipTypes[d.type as RelationshipType];
          if (!relationshipEnabled) {
            return 0.3; // Show filtered relationships with reduced but still visible opacity
          }
          
          // No node selected - links have default opacity
          return 0.7;
        });
    }
  }, [selectedNodeId, highlightedNodeIds, filters.relationshipTypes]);

  // Always ensure links are visible with appropriate styling when filter conditions change
  useEffect(() => {
    if (svgRef.current && filteredData.links.length > 0) {
      console.log("ForceGraph: Ensuring all edges are visible after filter change");
      
      // Re-apply styling to all paths to ensure they're visible
      d3.select(svgRef.current)
        .selectAll('path')
        .attr('stroke-dasharray', d => {
          // Show dashed line for conflict relationship type
          if (d.type === 'conflict') return '5,5';
          
          // Show dotted line for relationships that are filtered out
          const relationshipEnabled = filters.relationshipTypes[d.type as RelationshipType];
          if (!relationshipEnabled) return '2,2';
          
          // Solid line for enabled relationships
          return null;
        })
        .style('opacity', d => {
          // If a node is selected, highlight its connected links
          if (selectedNodeId) {
            const sourceId = typeof d.source === 'object' ? d.source.id : d.source;
            const targetId = typeof d.target === 'object' ? d.target.id : d.target;
            
            // Show links connected to the selected node with full opacity
            const isConnected = sourceId === selectedNodeId || targetId === selectedNodeId;
            return isConnected ? 1.0 : 0.1;
          }
          
          // If there are highlighted nodes from search, highlight their links too
          if (highlightedNodeIds.length > 0) {
            const sourceId = typeof d.source === 'object' ? d.source.id : d.source;
            const targetId = typeof d.target === 'object' ? d.target.id : d.target;
            
            // Show links connected to any highlighted node with full opacity
            const isConnected = 
              highlightedNodeIds.includes(sourceId) || 
              highlightedNodeIds.includes(targetId);
            
            return isConnected ? 1.0 : 0.1;
          }
          
          // Apply relationship type filter by adjusting opacity rather than removing links
          const relationshipEnabled = filters.relationshipTypes[d.type as RelationshipType];
          if (!relationshipEnabled) {
            return 0.4; // Increase opacity slightly to make filtered edges more visible
          }
          
          // No node selected - all links have default opacity
          return 0.8;
        });
      
      // Force-restart the simulation gently to ensure edges stay visible
      if (simulationRef.current) {
        simulationRef.current.alpha(0.05).restart();
      }
    }
  }, [filteredData, filters.relationshipTypes, selectedNodeId, highlightedNodeIds, svgRef.current]);

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
    <Box width="100%" height="100%" overflow="hidden" position="relative">
      <svg ref={svgRef} width={width} height={height} />
    </Box>
  );
};

export default ForceGraph;
