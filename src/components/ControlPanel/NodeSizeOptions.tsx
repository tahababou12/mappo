import React from 'react';
import {
  Box,
  Heading,
  RadioGroup,
  Radio,
  Stack,
  useColorMode
} from '@chakra-ui/react';

interface NodeSizeOptionsProps {
  attribute: string;
  onChange: (attribute: string) => void;
}

const NodeSizeOptions: React.FC<NodeSizeOptionsProps> = ({ attribute, onChange }) => {
  const { colorMode } = useColorMode();
  
  return (
    <Box mb={4}>
      <Heading size="sm" mb={2}>Node Size By</Heading>
      <RadioGroup 
        value={attribute} 
        onChange={onChange}
        colorScheme={colorMode === 'dark' ? 'blue' : 'brand'}
      >
        <Stack spacing={2}>
          <Radio value="degree">Connections (Degree)</Radio>
          <Radio value="betweenness">Betweenness Centrality</Radio>
          <Radio value="equal">Equal Size</Radio>
        </Stack>
      </RadioGroup>
    </Box>
  );
};

export default NodeSizeOptions;
