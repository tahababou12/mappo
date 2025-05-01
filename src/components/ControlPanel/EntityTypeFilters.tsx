import React from 'react';
import { 
  Box, 
  Heading, 
  Stack, 
  Checkbox, 
  Flex, 
  useColorMode 
} from '@chakra-ui/react';
import { EntityType } from '../../types';
import theme from '../../theme';

interface EntityTypeFiltersProps {
  filters: Record<EntityType, boolean>;
  onChange: (type: EntityType, checked: boolean) => void;
}

const EntityTypeFilters: React.FC<EntityTypeFiltersProps> = ({ filters, onChange }) => {
  const { colorMode } = useColorMode();
  const entityTypes: EntityType[] = ['person', 'organization', 'event', 'location'];

  return (
    <Box mb={4}>
      <Heading size="sm" mb={2}>Entity Types</Heading>
      <Stack spacing={2}>
        {entityTypes.map((type) => (
          <Flex key={type} align="center">
            <Checkbox 
              isChecked={filters[type]} 
              onChange={(e) => onChange(type, e.target.checked)}
              colorScheme={colorMode === 'dark' ? 'blue' : 'brand'}
              size="md"
            >
              <Flex align="center">
                <Box 
                  w="3" 
                  h="3" 
                  borderRadius="full" 
                  bg={(theme.colors.entityColors as Record<string, string>)[type]} 
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

export default EntityTypeFilters;
