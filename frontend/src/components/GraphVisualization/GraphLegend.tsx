import React from 'react';
import { 
  Box, 
  Flex, 
  Text, 
  useColorMode, 
  IconButton,
  Collapse,
  useDisclosure
} from '@chakra-ui/react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import theme from '../../theme';

interface GraphLegendProps {
  showEntityTypes: boolean;
  showRelationshipTypes: boolean;
}

const GraphLegend: React.FC<GraphLegendProps> = ({ showEntityTypes, showRelationshipTypes }) => {
  const { colorMode } = useColorMode();
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: true });
  const textColor = colorMode === 'dark' ? 'white' : 'gray.800';
  const bgColor = colorMode === 'dark' ? 'gray.700' : 'white';

  return (
    <Box 
      position="absolute" 
      bottom="4" 
      right="4" 
      bg={bgColor} 
      borderRadius="md" 
      boxShadow="md"
      maxW="250px"
      zIndex="10"
      overflow="hidden"
    >
      <Flex 
        align="center" 
        justify="space-between" 
        p="2" 
        borderBottomWidth={isOpen ? "1px" : "0"}
        borderColor={colorMode === 'dark' ? 'gray.600' : 'gray.200'}
      >
        <Text fontWeight="bold" fontSize="sm">Legend</Text>
        <IconButton
          aria-label={isOpen ? "Collapse legend" : "Expand legend"}
          icon={isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          size="xs"
          variant="ghost"
          onClick={onToggle}
        />
      </Flex>
      
      <Collapse in={isOpen} animateOpacity>
        <Box p="3">
          {showEntityTypes && (
            <Box mb="3">
              <Text fontSize="sm" fontWeight="semibold" mb="1">Entity Types</Text>
              <Flex direction="column" gap="1">
                {Object.entries(theme.colors.entityColors).map(([type, color]) => (
                  <Flex key={type} align="center" gap="2">
                    <Box w="3" h="3" borderRadius="full" bg={color as string} />
                    <Text fontSize="xs" color={textColor} textTransform="capitalize">{type}</Text>
                  </Flex>
                ))}
              </Flex>
            </Box>
          )}
          
          {showRelationshipTypes && (
            <Box>
              <Text fontSize="sm" fontWeight="semibold" mb="1">Relationship Types</Text>
              <Flex direction="column" gap="1">
                {Object.entries(theme.colors.relationshipColors).map(([type, color]) => (
                  <Flex key={type} align="center" gap="2">
                    <Box w="8" h="2" bg={color as string} />
                    <Text fontSize="xs" color={textColor} textTransform="capitalize">{type}</Text>
                  </Flex>
                ))}
              </Flex>
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};

export default GraphLegend;
