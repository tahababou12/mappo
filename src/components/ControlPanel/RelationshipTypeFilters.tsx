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
  const relationshipTypes: RelationshipType[] = ['family', 'professional', 'social', 'political', 'conflict'];

  return (
    <Box mb={4}>
      <Heading size="sm" mb={2}>Relationship Types</Heading>
      <Stack spacing={2}>
        {relationshipTypes.map((type) => (
          <Flex key={type} align="center">
            <Checkbox 
              isChecked={filters[type]} 
              onChange={(e) => onChange(type, e.target.checked)}
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
                <Box textTransform="capitalize">{type}</Box>
              </Flex>
            </Checkbox>
          </Flex>
        ))}
      </Stack>
    </Box>
  );
};

export default RelationshipTypeFilters;
