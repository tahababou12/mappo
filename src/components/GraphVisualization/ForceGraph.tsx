import React, { useRef, useEffect, useState } from 'react';
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
  const { colorMode } = useColorMode();
  const [simulation, setSimulation] = useState<d3.Simulation<GraphNode, GraphLink> | null>(null);

  // Filter data based on current filters
  const filteredData = React.useMemo(() => {
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
    
    return { nodes: filteredNodes, links: filteredLinks };
  }, [data, filters]);

  useEffect(() => {
    if (!svgRef.current) return;

    // Clear previous graph
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height])
      .attr('style', 'max-width: 100%; height: auto;');

    // Add zoom functionality
    const g = svg.append('g');
    
    svg.call(
      d3.zoom<SVGSVGElement, unknown>()
        .extent([[0, 0], [width, height]])
        .scaleExtent([0.1, 8])
        .on('zoom', (event) => {
          g.attr('transform', event.transform);
        })
    );

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

    // Create the links
    const link = g.append('g')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(filteredData.links)
      .join('line')
      .attr('stroke-width', d => (d.strength || 1) * 2)
      .attr('stroke', d => (theme.colors.relationshipColors as Record<string, string>)[d.type])
      .attr('stroke-dasharray', d => d.type === 'conflict' ? '5,5' : null);

    // Create the nodes
    const node = g.append('g')
      .selectAll('circle')
      .data(filteredData.nodes)
      .join('circle')
      .attr('r', d => {
        // Base size on node degree or selected attribute
        if (filters.nodeSizeAttribute === 'equal') {
          return 8;
        }
        
        const nodeLinks = filteredData.links.filter(
          link => link.source === d.id || link.target === d.id
        );
        
        // Scale based on connections (degree)
        if (filters.nodeSizeAttribute === 'degree') {
          return Math.max(5, Math.min(15, 5 + nodeLinks.length));
        }
        
        // For betweenness centrality, we'd need to calculate it
        // This is a simplified approximation
        if (filters.nodeSizeAttribute === 'betweenness') {
          const uniqueConnections = new Set();
          nodeLinks.forEach(link => {
            const otherId = link.source === d.id ? link.target : link.source;
            uniqueConnections.add(otherId);
          });
          return Math.max(5, Math.min(15, 5 + uniqueConnections.size));
        }
        
        return 8; // Default
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
        return colorMode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';
      })
      .attr('stroke-width', d => d.id === selectedNodeId ? 3 : highlightedNodeIds.includes(d.id) ? 2 : 1)
      .call(drag(simulation) as any);

    // Add node labels
    const labels = g.append('g')
      .selectAll('text')
      .data(filteredData.nodes)
      .join('text')
      .attr('dx', 12)
      .attr('dy', '.35em')
      .text(d => d.name)
      .attr('font-size', '10px')
      .attr('fill', colorMode === 'dark' ? 'white' : 'black')
      .style('pointer-events', 'none')
      .style('opacity', d => {
        if (d.id === selectedNodeId) return 1;
        if (highlightedNodeIds.includes(d.id)) return 0.9;
        return 0.7;
      })
      .style('font-weight', d => 
        d.id === selectedNodeId || highlightedNodeIds.includes(d.id) ? 'bold' : 'normal'
      );

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

    // Create the simulation with stable parameters
    const sim = d3.forceSimulation<GraphNode, GraphLink>(filteredData.nodes as GraphNode[])
      .force('link', d3.forceLink<GraphNode, GraphLink>(filteredData.links as GraphLink[])
        .id(d => d.id)
        .distance(80) // Slightly increased for better spacing
      )
      .force('charge', d3.forceManyBody()
        .strength(-120) // Reduced strength for more stability
        .distanceMax(300) // Limit the distance of effect
      )
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30))
      .velocityDecay(0.4) // Higher decay for more damping
      .alphaDecay(0.01) // Slower decay for smoother settling
      .alphaMin(0.001) // Lower minimum to allow more settling time
      .alpha(0.3); // Lower initial alpha for gentler start

    // Update positions on tick
    sim.on('tick', () => {
      // Constrain nodes to the visible area with some padding
      filteredData.nodes.forEach(node => {
        const r = 10; // Node radius + padding
        if (node.x) node.x = Math.max(r, Math.min(width - r, node.x));
        if (node.y) node.y = Math.max(r, Math.min(height - r, node.y));
      });

      link
        .attr('x1', d => (d.source as GraphNode).x || 0)
        .attr('y1', d => (d.source as GraphNode).y || 0)
        .attr('x2', d => (d.target as GraphNode).x || 0)
        .attr('y2', d => (d.target as GraphNode).y || 0);

      node
        .attr('cx', d => d.x || 0)
        .attr('cy', d => d.y || 0);

      labels
        .attr('x', d => d.x || 0)
        .attr('y', d => d.y || 0);
    });

    // Stop the simulation after a reasonable time to ensure stability
    setTimeout(() => {
      sim.alphaTarget(0).alpha(0.1);
    }, 3000);

    setSimulation(sim);

    // Cleanup
    return () => {
      sim.stop();
    };
  }, [filteredData, width, height, colorMode, selectedNodeId, highlightedNodeIds, onNodeClick, onNodeHover, filters.showCommunities, filters.nodeSizeAttribute]);

  // Update simulation when layout changes
  useEffect(() => {
    if (!simulation) return;

    switch (filters.layout) {
      case 'force':
        simulation
          .force('center', d3.forceCenter(width / 2, height / 2))
          .force('charge', d3.forceManyBody()
            .strength(-120)
            .distanceMax(300)
          )
          .alpha(0.1).restart();
        break;
      case 'radial':
        simulation
          .force('center', null)
          .force('charge', d3.forceManyBody().strength(-80))
          .force('r', d3.forceRadial(Math.min(width, height) / 4, width / 2, height / 2).strength(0.8))
          .alpha(0.1).restart();
        break;
      case 'hierarchical':
        simulation
          .force('center', null)
          .force('charge', d3.forceManyBody().strength(-80))
          .force('x', d3.forceX(width / 2).strength(0.1))
          .force('y', d3.forceY().y(d => {
            // Simple hierarchical layout based on node type
            switch (d.type) {
              case 'person': return height * 0.3;
              case 'organization': return height * 0.5;
              case 'event': return height * 0.7;
              case 'location': return height * 0.9;
              default: return height / 2;
            }
          }).strength(0.2))
          .alpha(0.1).restart();
        break;
    }
  }, [filters.layout, simulation, width, height]);

  // Drag functionality
  function drag(simulation: d3.Simulation<GraphNode, GraphLink> | null) {
    function dragstarted(event: any) {
      if (!event.active && simulation) simulation.alphaTarget(0.1).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }
    
    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }
    
    function dragended(event: any) {
      if (!event.active && simulation) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
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
