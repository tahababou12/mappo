import React from 'react';
import { 
  Box, 
  Heading, 
  Stack, 
  Checkbox, 
  Flex, 
  useColorMode 
} from '@chakra-ui/react';
import { RelationshipType } from '../../types';
import theme from '../../theme';

interface RelationshipTypeFiltersProps {
  filters: Record<RelationshipType, boolean>;
  onChange: (type: RelationshipType, checked: boolean) => void;
}

const RelationshipTypeFilters: React.FC<RelationshipTypeFiltersProps> = ({ filters, onChange }) => {
  const { colorMode } = useColorMode();
  // Use action types that match our Excel data
  const actionTypes: { [key in RelationshipType]?: string } = {
    'professional': 'Writing/Professional',
    'social': 'Meeting/Visit',
    'family': 'Family',
    'political': 'Political',
    'conflict': 'Conflict/Dispute',
    'cultural': 'Viewing/Art Related'
  };

  // Handle checkbox change safely - prevent unchecking the last selected type
  const handleCheckboxChange = (type: RelationshipType, checked: boolean) => {
    // Only allow unchecking if there will still be at least one selected type
    if (!checked) {
      const selectedCount = Object.values(filters).filter(Boolean).length;
      if (selectedCount <= 1) {
        console.log("Cannot uncheck the last selected relationship type");
        return; // Prevent unchecking the last one
      }
    }
    onChange(type, checked);
  };

  return (
    <Box mb={4}>
      <Heading size="sm" mb={2}>Relationship Actions</Heading>
      <Stack spacing={2}>
        {Object.entries(actionTypes).map(([type, label]) => (
          <Flex key={type} align="center">
            <Checkbox 
              isChecked={filters[type as RelationshipType]} 
              onChange={(e) => handleCheckboxChange(type as RelationshipType, e.target.checked)}
              colorScheme={colorMode === 'dark' ? 'blue' : 'brand'}
              size="md"
            >
              <Flex align="center">
                <Box 
                  w="6" 
                  h="2" 
                  bg={(theme.colors.relationshipColors as Record<string, string>)[type]} 
                  mr={2} 
                />
                <Box>{label}</Box>
              </Flex>
            </Checkbox>
          </Flex>
        ))}
      </Stack>
    </Box>
  );
};

export default RelationshipTypeFilters;
