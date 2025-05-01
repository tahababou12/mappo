import React from 'react';
import {
  Box,
  Heading,
  RadioGroup,
  Radio,
  Stack,
  useColorMode
} from '@chakra-ui/react';
import { LayoutType } from '../../types';

interface LayoutOptionsProps {
  layout: LayoutType;
  onChange: (layout: LayoutType) => void;
}

const LayoutOptions: React.FC<LayoutOptionsProps> = ({ layout, onChange }) => {
  const { colorMode } = useColorMode();
  
  return (
    <Box mb={4}>
      <Heading size="sm" mb={2}>Graph Layout</Heading>
      <RadioGroup 
        value={layout} 
        onChange={(value) => onChange(value as LayoutType)}
        colorScheme={colorMode === 'dark' ? 'blue' : 'brand'}
      >
        <Stack spacing={2}>
          <Radio value="force">Force-Directed</Radio>
          <Radio value="radial">Radial</Radio>
          <Radio value="hierarchical">Hierarchical</Radio>
        </Stack>
      </RadioGroup>
    </Box>
  );
};

export default LayoutOptions;
