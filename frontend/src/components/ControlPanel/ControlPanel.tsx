import React from 'react';
import {
  Box,
  VStack,
  Heading,
  Divider,
  Switch,
  FormControl,
  FormLabel,
  useColorMode,
  Button,
  Flex,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from '@chakra-ui/react';
import { Moon, Sun } from 'lucide-react';
import RelationshipTypeFilters from './RelationshipTypeFilters';
import TimeRangeSlider from './TimeRangeSlider';
import NodeSizeOptions from './NodeSizeOptions';
import { FilterState, RelationshipType, LayoutType } from '../../types';

interface ControlPanelProps {
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ filters, onFilterChange }) => {
  const { colorMode, toggleColorMode } = useColorMode();

  const handleRelationshipTypeChange = (type: RelationshipType, checked: boolean) => {
    onFilterChange({
      relationshipTypes: {
        ...filters.relationshipTypes,
        [type]: checked
      }
    });
  };

  const handleTimeRangeChange = (range: [number, number]) => {
    onFilterChange({ timeRange: range });
  };

  const handleLayoutChange = (layout: LayoutType) => {
    onFilterChange({ layout });
  };

  const handleNodeSizeAttributeChange = (attribute: string) => {
    onFilterChange({ nodeSizeAttribute: attribute });
  };

  const handleCommunityToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ showCommunities: e.target.checked });
  };

  const resetAllFilters = () => {
    onFilterChange({
      entityTypes: {
        person: true,
        organization: true,
        event: true,
        location: true
      },
      relationshipTypes: {
        family: true,
        professional: true,
        social: true,
        political: true,
        conflict: true,
        cultural: true
      }
    });
  };

  const resetFilters = () => {
    onFilterChange({
      entityTypes: {
        person: true,
        organization: false,
        event: false,
        location: false
      },
      relationshipTypes: {
        family: true,
        professional: true,
        social: true,
        political: true,
        conflict: true,
        cultural: true
      },
      timeRange: [1800, 1900],
      showCommunities: false,
      layout: 'force',
      nodeSizeAttribute: 'degree'
    });
  };

  const showAllRelationships = () => {
    onFilterChange({
      relationshipTypes: {
        family: true,
        professional: true,
        social: true,
        political: true,
        conflict: true,
        cultural: true
      }
    });
  };

  return (
    <Box 
      p={4} 
      bg={colorMode === 'dark' ? 'gray.800' : 'white'} 
      borderRadius="md" 
      boxShadow="sm"
      height="100%"
      overflowY="auto"
    >
      <VStack spacing={4} align="stretch">
        <Flex justify="space-between" align="center">
          <Heading size="md">Control Panel</Heading>
          <Button 
            size="sm" 
            onClick={toggleColorMode} 
            variant="ghost"
            aria-label={colorMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {colorMode === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </Button>
        </Flex>
        
        <Button 
          onClick={resetAllFilters} 
          size="sm" 
          colorScheme={colorMode === 'dark' ? 'blue' : 'brand'}
        >
          Show All Nodes & Links
        </Button>
        
        <Divider />
        
        <Accordion defaultIndex={[0, 1]} allowMultiple>
          <AccordionItem>
            <h2>
              <AccordionButton>
                <Box flex="1" textAlign="left" fontWeight="semibold">
                  Relationship Actions
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4}>
              <RelationshipTypeFilters 
                filters={filters.relationshipTypes} 
                onChange={handleRelationshipTypeChange} 
              />
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem>
            <h2>
              <AccordionButton>
                <Box flex="1" textAlign="left" fontWeight="semibold">
                  Time Period
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4}>
              <TimeRangeSlider 
                range={filters.timeRange} 
                min={1800} 
                max={1900} 
                onChange={handleTimeRangeChange} 
              />
              
              {/* <LayoutOptions 
                layout={filters.layout} 
                onChange={handleLayoutChange} 
              /> */}
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem>
            <h2>
              <AccordionButton>
                <Box flex="1" textAlign="left" fontWeight="semibold">
                  Advanced Options
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4}>
              <NodeSizeOptions 
                attribute={filters.nodeSizeAttribute} 
                onChange={handleNodeSizeAttributeChange} 
              />
              
              <FormControl display="flex" alignItems="center" mb={4}>
                <FormLabel htmlFor="community-detection" mb="0" fontSize="sm">
                  Show Communities
                </FormLabel>
                <Switch 
                  id="community-detection" 
                  isChecked={filters.showCommunities}
                  onChange={handleCommunityToggle}
                  colorScheme={colorMode === 'dark' ? 'blue' : 'brand'}
                />
              </FormControl>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
        
        <Flex direction="column" gap={2}>
          <Button 
            onClick={resetFilters} 
            size="sm" 
            colorScheme={colorMode === 'dark' ? 'blue' : 'brand'}
            variant="outline"
          >
            Reset All Filters
          </Button>

          <Button 
            onClick={showAllRelationships} 
            size="sm" 
            colorScheme={colorMode === 'dark' ? 'blue' : 'brand'}
            variant="outline"
          >
            Show All Relationships
          </Button>
        </Flex>
      </VStack>
    </Box>
  );
};

export default ControlPanel;
