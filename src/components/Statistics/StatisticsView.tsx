import React, { useMemo } from 'react';
import {
  Box,
  Heading,
  Grid,
  Text,
  Flex,
  Badge,
  Divider,
  useColorMode,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  Card,
  CardBody,
  Progress,
} from '@chakra-ui/react';
import { BarChart3, TrendingUp, Network, Users, Building, Calendar, MapPin } from 'lucide-react';
import { GraphData } from '../../types';

interface StatisticsViewProps {
  data: GraphData;
}

const StatisticsView: React.FC<StatisticsViewProps> = ({ data }) => {
  const { colorMode } = useColorMode();

  // Calculate network statistics
  const stats = useMemo(() => {
    // Basic counts
    const personCount = data.nodes.filter(n => n.type === 'person').length;
    const organizationCount = data.nodes.filter(n => n.type === 'organization').length;
    const eventCount = data.nodes.filter(n => n.type === 'event').length;
    const locationCount = data.nodes.filter(n => n.type === 'location').length;
    
    // Calculate average degree (connections per node)
    const avgDegree = data.links.length * 2 / data.nodes.length;
    
    // Calculate network density
    const density = data.links.length / (data.nodes.length * (data.nodes.length - 1) / 2);
    
    // Calculate time range
    const nodeYears = data.nodes
      .filter(n => n.startDate)
      .map(n => parseInt(n.startDate!.split('-')[0]));
    
    const minYear = Math.min(...nodeYears);
    const maxYear = Math.max(...nodeYears);
    
    // Get top 5 most connected entities
    const nodeDegrees = data.nodes.map(node => {
      const connections = data.links.filter(link => {
        // @ts-ignore - Ignoring type checking for source and target properties
        const source = typeof link.source === 'object' ? link.source.id : link.source;
        // @ts-ignore - Ignoring type checking for source and target properties
        const target = typeof link.target === 'object' ? link.target.id : link.target;
        return source === node.id || target === node.id;
      }).length;
      
      return {
        id: node.id,
        name: node.name,
        type: node.type,
        connections
      };
    });
    
    const topConnected = nodeDegrees
      .sort((a, b) => b.connections - a.connections)
      .slice(0, 5);
    
    // Relationship type distribution
    const relationshipTypes: Record<string, number> = {};
    data.links.forEach(link => {
      if (!relationshipTypes[link.type]) {
        relationshipTypes[link.type] = 0;
      }
      relationshipTypes[link.type]++;
    });
    
    // Convert to array of {type, count, percentage}
    const relationshipDistribution = Object.entries(relationshipTypes).map(([type, count]) => ({
      type,
      count,
      percentage: (count / data.links.length) * 100
    })).sort((a, b) => b.count - a.count);
    
    return {
      nodes: data.nodes.length,
      links: data.links.length,
      personCount,
      organizationCount,
      eventCount,
      locationCount,
      avgDegree,
      density,
      timeRange: `${minYear} - ${maxYear}`,
      topConnected,
      relationshipDistribution
    };
  }, [data]);

  return (
    <Box 
      width="100%" 
      height="100%" 
      p={4} 
      bg={colorMode === 'dark' ? 'gray.900' : 'gray.50'}
      overflowY="auto"
    >
      <Flex align="center" mb={6}>
        <BarChart3 size={24} className="mr-2" />
        <Heading size="lg">Network Statistics</Heading>
      </Flex>

      {/* Top stats overview */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4} mb={6}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel display="flex" alignItems="center">
                <Network size={16} className="mr-1" /> Total Entities
              </StatLabel>
              <StatNumber>{stats.nodes}</StatNumber>
              <StatHelpText>
                {stats.links} relationships
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel display="flex" alignItems="center">
                <TrendingUp size={16} className="mr-1" /> Network Metrics
              </StatLabel>
              <StatNumber>{stats.avgDegree.toFixed(2)}</StatNumber>
              <StatHelpText>
                Avg. connections per entity
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel display="flex" alignItems="center">
                <Users size={16} className="mr-1" /> People
              </StatLabel>
              <StatNumber>{stats.personCount}</StatNumber>
              <StatHelpText>
                {((stats.personCount / stats.nodes) * 100).toFixed(1)}% of network
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel display="flex" alignItems="center">
                <Calendar size={16} className="mr-1" /> Time Range
              </StatLabel>
              <StatNumber>{stats.timeRange}</StatNumber>
              <StatHelpText>
                Historical period
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Entity type breakdown */}
      <Heading size="md" mb={3}>Entity Type Distribution</Heading>
      <Grid templateColumns="repeat(4, 1fr)" gap={4} mb={6}>
        <Box p={4} borderRadius="md" bg={colorMode === 'dark' ? 'blue.800' : 'blue.50'}>
          <Flex direction="column" align="center">
            <Users size={20} />
            <Text fontWeight="bold" fontSize="xl" mt={2}>{stats.personCount}</Text>
            <Text fontSize="sm">People</Text>
          </Flex>
        </Box>
        
        <Box p={4} borderRadius="md" bg={colorMode === 'dark' ? 'orange.800' : 'orange.50'}>
          <Flex direction="column" align="center">
            <Building size={20} />
            <Text fontWeight="bold" fontSize="xl" mt={2}>{stats.organizationCount}</Text>
            <Text fontSize="sm">Organizations</Text>
          </Flex>
        </Box>
        
        <Box p={4} borderRadius="md" bg={colorMode === 'dark' ? 'purple.800' : 'purple.50'}>
          <Flex direction="column" align="center">
            <Calendar size={20} />
            <Text fontWeight="bold" fontSize="xl" mt={2}>{stats.eventCount}</Text>
            <Text fontSize="sm">Events</Text>
          </Flex>
        </Box>
        
        <Box p={4} borderRadius="md" bg={colorMode === 'dark' ? 'green.800' : 'green.50'}>
          <Flex direction="column" align="center">
            <MapPin size={20} />
            <Text fontWeight="bold" fontSize="xl" mt={2}>{stats.locationCount}</Text>
            <Text fontSize="sm">Locations</Text>
          </Flex>
        </Box>
      </Grid>

      {/* Top connected entities */}
      <Heading size="md" mb={3}>Most Connected Entities</Heading>
      <Box p={4} borderRadius="md" bg={colorMode === 'dark' ? 'gray.800' : 'white'} mb={6}>
        {stats.topConnected.map((entity, index) => (
          <Box key={entity.id} mb={index < stats.topConnected.length - 1 ? 3 : 0}>
            <Flex justify="space-between" align="center">
              <Flex align="center">
                <Text fontWeight="bold">{entity.name}</Text>
                <Badge ml={2} colorScheme={
                  entity.type === 'person' ? 'blue' :
                  entity.type === 'organization' ? 'orange' :
                  entity.type === 'event' ? 'purple' : 'green'
                }>
                  {entity.type}
                </Badge>
              </Flex>
              <Text fontWeight="bold">{entity.connections}</Text>
            </Flex>
            <Progress 
              value={entity.connections} 
              max={stats.topConnected[0].connections}
              size="sm"
              colorScheme="blue"
              mt={1}
            />
          </Box>
        ))}
      </Box>

      {/* Relationship distribution */}
      <Heading size="md" mb={3}>Relationship Types</Heading>
      <Box p={4} borderRadius="md" bg={colorMode === 'dark' ? 'gray.800' : 'white'} mb={6}>
        {stats.relationshipDistribution.map((rel, index) => (
          <Box key={rel.type} mb={index < stats.relationshipDistribution.length - 1 ? 3 : 0}>
            <Flex justify="space-between" align="center">
              <Text fontWeight="bold" textTransform="capitalize">{rel.type}</Text>
              <Text>{rel.count} ({rel.percentage.toFixed(1)}%)</Text>
            </Flex>
            <Progress 
              value={rel.percentage} 
              size="sm"
              colorScheme="green"
              mt={1}
            />
          </Box>
        ))}
      </Box>

      {/* Network metrics detail */}
      <Heading size="md" mb={3}>Network Analysis</Heading>
      <Grid templateColumns="1fr 1fr" gap={4} mb={6}>
        <Box p={4} borderRadius="md" bg={colorMode === 'dark' ? 'gray.800' : 'white'}>
          <Text fontWeight="bold">Average Degree</Text>
          <Text fontSize="2xl">{stats.avgDegree.toFixed(2)}</Text>
          <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
            Average connections per entity
          </Text>
        </Box>
        
        <Box p={4} borderRadius="md" bg={colorMode === 'dark' ? 'gray.800' : 'white'}>
          <Text fontWeight="bold">Network Density</Text>
          <Text fontSize="2xl">{stats.density.toFixed(4)}</Text>
          <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
            Proportion of potential connections that are actual connections
          </Text>
        </Box>
      </Grid>

      <Divider mb={6} />

      <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
        These statistics are calculated from the current graph data containing {stats.nodes} entities and {stats.links} relationships.
      </Text>
    </Box>
  );
};

export default StatisticsView; 