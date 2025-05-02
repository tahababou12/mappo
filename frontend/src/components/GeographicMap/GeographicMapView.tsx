import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Heading,
  Flex,
  Text,
  Badge,
  useColorMode,
  Select,
  HStack,
  Tooltip as ChakraTooltip,
  IconButton,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  Button,
  VStack,
} from '@chakra-ui/react';
import { 
  Map as MapIcon, 
  Maximize2, 
  Minimize2, 
  Info, 
  Filter, 
  Layers, 
  Plus, 
  Minus,
  RefreshCw
} from 'lucide-react';
import { MapContainer, TileLayer, Popup, CircleMarker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { GraphData, Entity } from '../../types';

// Fix for default Leaflet icon issue in webpack
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix the default icon issue
const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface GeographicMapViewProps {
  data: GraphData;
  onNodeSelect: (nodeId: string) => void;
}

// Mock map data - in a real application, this would be replaced with actual map coordinates
interface MapLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: string;
  entityCount: number;
  entities: Entity[];
}

interface LocationDataEntry {
  entities: Entity[];
  lat: number;
  lng: number;
}

// Map style options
type MapStyle = 'streets' | 'satellite' | 'light' | 'dark' | 'outdoors' | 'historical';

// Helper component to handle map view changes
function MapController({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  
  return null;
}

const GeographicMapView: React.FC<GeographicMapViewProps> = ({ data, onNodeSelect }) => {
  const { colorMode } = useColorMode();
  const [selectedEntityType, setSelectedEntityType] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapStyle, setMapStyle] = useState<MapStyle>('streets');
  const [mapCenter, setMapCenter] = useState<[number, number]>([45, -20]); // Atlantic Ocean view to show US and Europe
  const [mapZoom, setMapZoom] = useState(3);
  
  // Map style options
  const mapStyles = {
    streets: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    light: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
    dark: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png',
    outdoors: 'https://tile.thunderforest.com/outdoors/{z}/{x}/{y}.png?apikey=3b9b7527b4c6487fabd5d300882e4a6f',
    historical: 'https://mapwarper.net/maps/tile/48990/{z}/{x}/{y}.png' // Global historical map
  };
  
  // Attribution text for the map tiles
  const mapAttributions = {
    streets: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    satellite: '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    light: '&copy; <a href="https://carto.com/attributions">CARTO</a>',
    dark: '&copy; <a href="https://carto.com/attributions">CARTO</a>',
    outdoors: '&copy; <a href="https://www.thunderforest.com/">Thunderforest</a>',
    historical: '&copy; <a href="https://mapwarper.net">MapWarper</a> contributors'
  };

  // Default coordinates for common locations (fallback)
  const defaultCoordinates: Record<string, { lat: number, lng: number }> = {
    // UK
    'London, UK': { lat: 51.5074, lng: -0.1278 },
    'Rydal, UK': { lat: 54.4468, lng: -2.9812 },
    'Oxford, UK': { lat: 51.7520, lng: -1.2577 },
    'Cumbria, UK': { lat: 54.5772, lng: -2.7975 },
    'England': { lat: 52.3555, lng: -1.1743 },
    'Keswick, UK': { lat: 54.6013, lng: -3.1347 },
    'Matlock Dale, UK': { lat: 53.1276, lng: -1.5594 },
    'Bolton Abbey, UK': { lat: 53.9837, lng: -1.8880 },
    'Brantwood, UK': { lat: 51.6205, lng: 0.3072 },
    'Dulwich, UK': { lat: 51.4433, lng: -0.0676 },
    'Herne Hill, UK': { lat: 51.4545, lng: -0.0967 },
    'Kendal, UK': { lat: 54.3280, lng: -2.7463 },
    'Leamington Spa, UK': { lat: 52.2852, lng: -1.5201 },
    'Leeds, UK': { lat: 53.8008, lng: -1.5491 },
    'Lichfield, UK': { lat: 52.6816, lng: -1.8317 },
    'Manchester, UK': { lat: 53.4808, lng: -2.2426 },
    'Marylebone, UK': { lat: 51.5189, lng: -0.1499 },
    'Northampton, UK': { lat: 52.2405, lng: -0.9027 },
    'Northwich, UK': { lat: 53.2587, lng: -2.5181 },
    'Penrith, UK': { lat: -33.7500, lng: 150.7000 },
    'Sandgate, UK': { lat: 51.0745, lng: 1.1392 },
    'Tunbridge Wells, UK': { lat: 51.1324, lng: 0.2637 },
    'Wroughton, UK': { lat: 51.5241, lng: -1.7879 },
    'Ambleside, UK': { lat: 54.380026, lng: -2.90680 },
    'Stratford-upon-Avon, UK': { lat: 52.1917, lng: -1.7083 },
    'Avebury, UK': { lat: 51.4295, lng: -1.8530 },
    'Birmingham, UK': { lat: 52.4862, lng: -1.8904 },
    'Romsey, UK': { lat: 50.9889, lng: -1.4966 },
    'Wales, UK': { lat: 52.1307, lng: -3.7837 },
    'Grasmere, UK': { lat: 54.4597, lng: -3.0244 },
    
    // France
    'Avallon, France': { lat: 47.4882, lng: 3.9077 },
    'Abbeville, France': { lat: 50.1055, lng: 1.8368 },
    'Beauvais, France': { lat: 49.4295, lng: 2.0807 },
    'Chamonix, France': { lat: 45.9237, lng: 6.8694 },
    'Paris, France': { lat: 48.8566, lng: 2.3522 },
    'Sallanches, Savoy, France': { lat: 45.9367, lng: 6.6306 },
    'Tocqueville, France': { lat: 49.6714, lng: -1.3356 },

    
    // Switzerland
    'Geneva, Switzerland': { lat: 46.2044, lng: 6.1432 },
    'Berne, Switzerland': { lat: 46.9480, lng: 7.4474 },
    'Lucerne, Switzerland': { lat: 47.0502, lng: 8.3093 },
    'Neuchatel, Switzerland': { lat: 46.9900, lng: 6.9293 },
    'Rheinfelden, Switzerland': { lat: 47.5522, lng: 7.7923 },
    'Thun, Switzerland': { lat: 46.7580, lng: 7.6280 },
    
    // Italy
    'Florence, Italy': { lat: 43.7696, lng: 11.2558 }, // Correct coordinates
    'Milan, Italy': { lat: 45.4642, lng: 9.1900 },
    'Milano': { lat: 45.4642, lng: 9.1900 },
    'Naples, Italy': { lat: 40.8518, lng: 14.2681 }, // Correct coordinates
    'Napoli': { lat: 40.8518, lng: 14.2681 },
    'Rome, Italy': { lat: 41.9028, lng: 12.4964 },
    'Roma': { lat: 41.9028, lng: 12.4964 },
    'Siena, Italy': { lat: 43.3188, lng: 11.3308 },
    'Venice, Italy': { lat: 45.4408, lng: 12.3155 },
    'Venezia': { lat: 45.4408, lng: 12.3155 },
    'Verona, Italy': { lat: 45.4386, lng: 10.9933 },
    'Italy': { lat: 41.8719, lng: 12.5674 },
    
    // Germany
    'Dresden, Germany': { lat: 51.0504, lng: 13.7373 },
    
    // USA
    'Boston': { lat: 42.3601, lng: -71.0589 },
    'Boston, MA, USA': { lat: 42.3601, lng: -71.0589 }, // Corrected from your data
    'New York, NY, USA': { lat: 40.7128, lng: -74.0060 },
    'White Mountains, NH, USA': { lat: 44.1644, lng: -71.4326 },
    'USA': { lat: 37.0902, lng: -95.7129 },
    'Wawona, CA, USA': { lat: 37.5369, lng: -119.6563 },
    'Washington, D.C., USA': { lat: 38.897127, lng: -77.032429 },
    'Yosemite, CA, USA': { lat: 37.8651, lng: -119.5383 },
    'Philadelphia, PA, USA': { lat: 39.9526, lng: -75.1652 },
    'Trumbull, CT, USA': { lat: 41.2429, lng: -73.2007 },
    
    // Regions
    'Europe': { lat: 54.5260, lng: 15.2551 },
  };

  // Generate location data from entity coordinates
  const mapLocations = useMemo(() => {
    console.log("Generating map locations...");
    console.log("Total entities:", data.nodes.length);
    
    // Count entities with direct location properties
    const entitiesWithLocation = data.nodes.filter(entity => entity.location).length;
    const entitiesWithLatLon = data.nodes.filter(entity => entity.lat !== undefined && entity.lon !== undefined).length;
    
    console.log("Entities with location property:", entitiesWithLocation);
    console.log("Entities with lat/lon properties:", entitiesWithLatLon);
    
    // Print the first 5 entities with actual coordinates to help debug
    const entitiesWithCoords = data.nodes.filter(entity => entity.lat !== undefined && entity.lon !== undefined);
    if (entitiesWithCoords.length > 0) {
      console.log("Entities with coordinates:", entitiesWithCoords.slice(0, 5).map(e => ({
        id: e.id,
        name: e.name,
        location: e.location,
        coords: [e.lat, e.lon]
      })));
    } else {
      console.log("No entities with direct lat/lon coordinates found!");
    }
    
    // Count entities with locations in metadata
    const entitiesWithMetadataLocations = data.nodes.filter(
      entity => entity.metadata && 
      entity.metadata.locations && 
      Array.isArray(entity.metadata.locations) && 
      (entity.metadata.locations as string[]).length > 0
    ).length;
    
    console.log("Entities with locations in metadata:", entitiesWithMetadataLocations);
    
    // Sample first 5 entities to check their structure
    console.log("Sample entities:", data.nodes.slice(0, 5).map(entity => ({
      id: entity.id,
      name: entity.name,
      location: entity.location,
      lat: entity.lat,
      lon: entity.lon,
      metadata: entity.metadata
    })));
    
    // Get unique locations from entities with coordinates
    const locationMap = new Map<string, LocationDataEntry>();
    
    // First create a map of all entity IDs to entities
    const entityMap = new Map<string, Entity>();
    data.nodes.forEach(entity => entityMap.set(entity.id, entity));
    
    // For entities with location data, group them by location
    data.nodes.forEach(entity => {
      // Check entity direct location property
      if (entity.location) {
        addEntityToLocationMap(entity, entity.location, entity.lat, entity.lon);
      }
      
      // Also check metadata for locations array
      if (entity.metadata && entity.metadata.locations && Array.isArray(entity.metadata.locations)) {
        const locationArray = entity.metadata.locations as string[];
        locationArray.forEach(locationStr => {
          if (locationStr && locationStr.trim()) {
            addEntityToLocationMap(entity, locationStr.trim());
          }
        });
      }
    });

    // Also check relationship metadata for locations
    data.links.forEach(link => {
      if (link.metadata && link.metadata.location) {
        const locationStr = link.metadata.location.toString().trim();
        if (locationStr) {
          // Get source and target entities
          // @ts-expect-error - The id property exists on the source object
          const sourceEntity = entityMap.get(typeof link.source === 'string' ? link.source : link.source.id);
          // @ts-expect-error - The id property exists on the target object
          const targetEntity = entityMap.get(typeof link.target === 'string' ? link.target : link.target.id);
          
          // Add both entities to this location
          if (sourceEntity) addEntityToLocationMap(sourceEntity, locationStr);
          if (targetEntity) addEntityToLocationMap(targetEntity, locationStr);
        }
      }
    });
    
    // Helper function to add an entity to the location map
    function addEntityToLocationMap(entity: Entity, locationStr: string, lat?: number, lon?: number) {
      const locationKey = locationStr.trim();
      
      if (!locationMap.has(locationKey)) {
        // Find the best coordinates to use for this location
        
        // FIRST PRIORITY: Use the entity's own longitude and latitude if available
        if (entity.lon !== undefined && entity.lat !== undefined) {
          // Make sure the coordinates are in the right order 
          // (entity.lat should be latitude, entity.lon should be longitude)
          console.log(`Using entity coordinates for ${locationKey}: [${entity.lat}, ${entity.lon}]`);
          locationMap.set(locationKey, {
            entities: [],
            lat: parseFloat(entity.lat.toString()),
            lng: parseFloat(entity.lon.toString())
          });
        }
        // SECOND PRIORITY: Use the provided lon/lat parameters (might come from other sources)
        else if (lat !== undefined && lon !== undefined) {
          console.log(`Using provided coordinates for ${locationKey}: [${lat}, ${lon}]`);
          locationMap.set(locationKey, {
            entities: [],
            lat: parseFloat(lat.toString()),
            lng: parseFloat(lon.toString())
          });
        }
        // THIRD PRIORITY: Check our dictionary of known locations
        else if (defaultCoordinates[locationKey]) {
          console.log(`Using default coordinates for ${locationKey}: [${defaultCoordinates[locationKey].lat}, ${defaultCoordinates[locationKey].lng}]`);
          locationMap.set(locationKey, {
            entities: [],
            lat: defaultCoordinates[locationKey].lat,
            lng: defaultCoordinates[locationKey].lng
          });
        }
        // FOURTH PRIORITY: If we can't find a location, log it and center of map
        else {
          console.log(`No coordinates found for location: ${locationKey}`);
          // Center of our map view as a fallback
          locationMap.set(locationKey, {
            entities: [],
            lat: 45,
            lng: -20
          });
        }
      }
      
      const locationData = locationMap.get(locationKey);
      if (locationData && !locationData.entities.some(e => e.id === entity.id)) {
        locationData.entities.push(entity);
      }
    }
    
    // Convert to array of MapLocation objects
    const locations = Array.from(locationMap.entries()).map(([name, data]) => ({
      id: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      name,
      lat: data.lat,
      lng: data.lng,
      type: data.entities.length > 1 ? 'multiple' : data.entities[0].type,
      entityCount: data.entities.length,
      entities: data.entities
    }));
    
    console.log(`Found ${locations.length} locations from entity data`);
    if (locations.length > 0) {
      console.log("Sample locations:", locations.slice(0, 5));
    }
    
    return locations;
  }, [data.nodes, data.links]);

  // Filter locations based on selected entity type
  const filteredLocations = useMemo(() => {
    if (selectedEntityType === 'all') {
      return mapLocations;
    }
    
    return mapLocations.filter(loc => {
      // For locations with multiple entities, include if at least one entity matches the type
      if (loc.type === 'multiple') {
        // Get all entities at this location
        const locationEntities = data.nodes.filter(entity => 
          entity.location === loc.name ||
          (entity.metadata && 
           entity.metadata.locations && 
           Array.isArray(entity.metadata.locations) &&
           (entity.metadata.locations as string[]).includes(loc.name))
        );
        return locationEntities.some(entity => entity.type === selectedEntityType);
      }
      
      return loc.type === selectedEntityType;
    });
  }, [mapLocations, selectedEntityType, data.nodes]);

  // Handle location click
  const handleLocationClick = (location: MapLocation) => {
    setSelectedLocation(location);
    onOpen();
  };

  // Handle view entity in graph button
  const handleViewEntityInGraph = (entityId: string) => {
    onNodeSelect(entityId);
    onClose();
  };

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Handle zoom in/out
  const handleZoomIn = () => {
    setMapZoom(prev => Math.min(prev + 1, 10));
  };

  const handleZoomOut = () => {
    setMapZoom(prev => Math.max(prev - 1, 3));
  };

  // Reset view
  const resetView = () => {
    setMapCenter([45, -20]);
    setMapZoom(3);
  };

  // Determine marker colors based on entity type
  const getMarkerColor = (type: string): string => {
    switch(type) {
      case 'person': return '#3182CE'; // blue
      case 'organization': return '#DD6B20'; // orange
      case 'event': return '#805AD5'; // purple
      case 'location': return '#38A169'; // green
      default: return '#718096'; // gray for multiple or unknown
    }
  };

  return (
    <Box 
      width="100%" 
      height="100%" 
      bg={colorMode === 'dark' ? 'gray.900' : 'gray.50'}
      position="relative"
    >
      {/* Map header */}
      <Flex 
        align="center" 
        justify="space-between" 
        p={4} 
        borderBottomWidth="1px" 
        borderColor={colorMode === 'dark' ? 'gray.700' : 'gray.200'}
      >
        <Flex align="center">
          <MapIcon size={24} className="mr-2" />
          <Heading size="lg">Geographic Distribution</Heading>
        </Flex>

        <HStack spacing={2}>
          <Select 
            value={selectedEntityType} 
            onChange={(e) => setSelectedEntityType(e.target.value)}
            size="sm"
            maxW="150px"
          >
            <option value="all">All Entities</option>
            <option value="person">People</option>
            <option value="organization">Organizations</option>
            <option value="event">Events</option>
            <option value="location">Locations</option>
          </Select>

          <Select 
            value={mapStyle} 
            onChange={(e) => setMapStyle(e.target.value as MapStyle)}
            size="sm"
            maxW="150px"
          >
            <option value="streets">Street Map</option>
            <option value="satellite">Satellite</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="outdoors">Outdoors</option>
            <option value="historical">Historical</option>
          </Select>

          <ChakraTooltip label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}>
            <IconButton
              aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              icon={isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              onClick={toggleFullscreen}
              size="sm"
            />
          </ChakraTooltip>

          <ChakraTooltip label="Map Layers">
            <IconButton
              aria-label="Map Layers"
              icon={<Layers size={18} />}
              size="sm"
            />
          </ChakraTooltip>

          <ChakraTooltip label="Filter">
            <IconButton
              aria-label="Filter"
              icon={<Filter size={18} />}
              size="sm"
            />
          </ChakraTooltip>
        </HStack>
      </Flex>

      {/* Interactive Map */}
      <Box 
        position="relative" 
        width="100%" 
        height="calc(100% - 72px)"
        bg={colorMode === 'dark' ? 'gray.800' : 'white'}
      >
        <Box position="relative" width="100%" height="100%">
          <MapContainer 
            center={mapCenter} 
            zoom={mapZoom} 
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              attribution={mapAttributions[mapStyle]}
              url={mapStyles[mapStyle]}
            />
            <MapController center={mapCenter} zoom={mapZoom} />
            
            {filteredLocations.map(location => (
              <CircleMarker
                key={location.id}
                center={[location.lat, location.lng]}
                radius={Math.min(5 + Math.sqrt(location.entityCount) * 2, 20)}
                fillColor={getMarkerColor(location.type)}
                color="#FFF"
                weight={1}
                opacity={0.8}
                fillOpacity={0.8}
                eventHandlers={{
                  click: () => handleLocationClick(location)
                }}
              >
                <Popup>
                  <Box p={1}>
                    <Text fontWeight="bold">{location.name}</Text>
                    <Text fontSize="sm">{location.entityCount} entities</Text>
                    <Button 
                      size="xs" 
                      colorScheme="blue" 
                      mt={2} 
                      onClick={() => handleLocationClick(location)}
                    >
                      View Details
                    </Button>
                  </Box>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
          
          {/* Map controls */}
          <Box
            position="absolute"
            bottom="70px"
            left="10px"
            bg={colorMode === 'dark' ? 'gray.800' : 'white'}
            borderRadius="md"
            p={2}
            boxShadow="md"
            zIndex={1000}
            opacity={0.9}
          >
            <VStack spacing={2}>
              <ChakraTooltip label="Zoom in">
                <IconButton
                  aria-label="Zoom in"
                  icon={<Plus size={18} />}
                  onClick={handleZoomIn}
                  size="sm"
                />
              </ChakraTooltip>
              <ChakraTooltip label="Zoom out">
                <IconButton
                  aria-label="Zoom out"
                  icon={<Minus size={18} />}
                  onClick={handleZoomOut}
                  size="sm"
                />
              </ChakraTooltip>
              <ChakraTooltip label="Reset view">
                <IconButton
                  aria-label="Reset view"
                  icon={<RefreshCw size={18} />}
                  onClick={resetView}
                  size="sm"
                />
              </ChakraTooltip>
            </VStack>
          </Box>
          
          {/* Map Legend */}
          <Box
            position="absolute"
            bottom="10px"
            right="10px"
            bg={colorMode === 'dark' ? 'gray.800' : 'white'}
            borderRadius="md"
            p={3}
            boxShadow="md"
            zIndex={1000}
            opacity={0.9}
          >
            <Text fontWeight="bold" mb={2}>Legend</Text>
            <Flex direction="column" gap={2}>
              <Flex align="center">
                <Box w="12px" h="12px" borderRadius="full" bg="#3182CE" mr={2} />
                <Text fontSize="sm">People</Text>
              </Flex>
              <Flex align="center">
                <Box w="12px" h="12px" borderRadius="full" bg="#DD6B20" mr={2} />
                <Text fontSize="sm">Organizations</Text>
              </Flex>
              <Flex align="center">
                <Box w="12px" h="12px" borderRadius="full" bg="#805AD5" mr={2} />
                <Text fontSize="sm">Events</Text>
              </Flex>
              <Flex align="center">
                <Box w="12px" h="12px" borderRadius="full" bg="#38A169" mr={2} />
                <Text fontSize="sm">Locations</Text>
              </Flex>
              <Flex align="center">
                <Box w="12px" h="12px" borderRadius="full" bg="#718096" mr={2} />
                <Text fontSize="sm">Multiple Types</Text>
              </Flex>
            </Flex>
          </Box>
          
          {/* Entity count */}
          <Box
            position="absolute"
            top="10px"
            left="10px"
            bg={colorMode === 'dark' ? 'gray.800' : 'white'}
            borderRadius="md"
            p={2}
            boxShadow="md"
            zIndex={1000}
            opacity={0.9}
          >
            <Text fontSize="sm" fontWeight="bold">
              Showing {filteredLocations.length} locations with {filteredLocations.reduce((sum, loc) => sum + loc.entityCount, 0)} entities
            </Text>
          </Box>
        </Box>
      </Box>

      {/* Location Details Drawer */}
      <Drawer
        isOpen={isOpen}
        placement="right"
        onClose={onClose}
        size="md"
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">
            {selectedLocation?.name}
          </DrawerHeader>

          <DrawerBody>
            {selectedLocation && (
              <Box>
                <Text fontSize="sm" mb={4}>
                  {selectedLocation.entityCount} {selectedLocation.entityCount === 1 ? 'entity' : 'entities'} associated with this location
                </Text>
                
                <Heading size="sm" mb={3}>Entities</Heading>
                {selectedLocation.entities.map(entity => (
                  <Box 
                    key={entity.id} 
                    p={3} 
                    mb={3} 
                    borderWidth="1px" 
                    borderRadius="md" 
                    _hover={{ bg: colorMode === 'dark' ? 'gray.700' : 'gray.50' }}
                  >
                    <Flex justify="space-between" align="center" mb={2}>
                      <Text fontWeight="bold">{entity.name}</Text>
                      <Badge colorScheme={
                        entity.type === 'person' ? 'blue' :
                        entity.type === 'organization' ? 'orange' :
                        entity.type === 'event' ? 'purple' : 'green'
                      }>
                        {entity.type}
                      </Badge>
                    </Flex>
                    
                    {entity.description && (
                      <Text fontSize="sm" noOfLines={2} mb={2}>
                        {entity.description}
                      </Text>
                    )}
                    
                    <Button
                      size="sm"
                      colorScheme="blue"
                      variant="outline"
                      onClick={() => handleViewEntityInGraph(entity.id)}
                      leftIcon={<Info size={14} />}
                    >
                      View in Network Graph
                    </Button>
                  </Box>
                ))}
              </Box>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default GeographicMapView; 