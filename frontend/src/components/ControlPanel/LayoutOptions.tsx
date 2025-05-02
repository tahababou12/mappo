import React from 'react';
import { Box, Radio, RadioGroup, Stack, Heading, useColorMode } from '@chakra-ui/react';
import { LayoutType } from '../../types';

interface LayoutOptionsProps {
  layout: LayoutType;
  onChange: (layout: LayoutType) => void;
}

const LayoutOptions: React.FC<LayoutOptionsProps> = ({ layout, onChange }) => {
  const { colorMode } = useColorMode();
  
  // Only use force layout
  React.useEffect(() => {
    // Ensure force layout is always selected
    if (layout !== 'force') {
      onChange('force');
    }
  }, [layout, onChange]);

  return (
    <Box mb={4}>
      <Heading size="sm" mb={2}>Layout</Heading>
      <RadioGroup value={layout} onChange={(value) => onChange(value as LayoutType)}>
        <Stack>
          <Radio 
            value="force" 
            colorScheme={colorMode === 'dark' ? 'blue' : 'brand'}
            isChecked={true}
          >
            Force-Directed (with Arrows)
          </Radio>
          {/* Removed other layout options */}
        </Stack>
      </RadioGroup>
    </Box>
  );
};

export default LayoutOptions;
